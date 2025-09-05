import { useState, useEffect } from 'react';
import { Goal, GoalPeriod, GoalsByPeriod, TaskType } from './types';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';

const STORAGE_KEY = 'goal-tracker-data';

export const useGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalsByPeriod>({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    yearly: []
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Always load from localStorage first (local-first approach)
  useEffect(() => {
    loadGoalsFromLocalStorage();
  }, []);

  // When user signs in, merge Supabase data with local data
  useEffect(() => {
    if (user && isLoaded) {
      mergeSupabaseWithLocal();
    }
  }, [user, isLoaded]);

  // Save to localStorage whenever goals change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoaded]);

  // Set up real-time subscription when user is authenticated
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time change received:', payload);
          handleRealtimeChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleRealtimeChange = (payload: any) => {
    if (!payload.new && !payload.old) return;

    const changeType = payload.eventType;
    
    if (changeType === 'INSERT' && payload.new) {
      const newGoal: Goal = {
        id: payload.new.goal_id,
        text: payload.new.text,
        completed: payload.new.completed,
        createdAt: new Date(payload.new.created_at),
        type: payload.new.type as TaskType
      };
      
      setGoals(prev => {
        const period = payload.new.period as GoalPeriod;
        // Check if goal already exists locally (avoid duplicates)
        const exists = prev[period].some(goal => goal.id === newGoal.id);
        if (exists) return prev;
        
        return {
          ...prev,
          [period]: [...prev[period], newGoal]
        };
      });
    } else if (changeType === 'UPDATE' && payload.new) {
      const updatedGoal: Goal = {
        id: payload.new.goal_id,
        text: payload.new.text,
        completed: payload.new.completed,
        createdAt: new Date(payload.new.created_at),
        type: payload.new.type as TaskType
      };
      
      setGoals(prev => {
        const period = payload.new.period as GoalPeriod;
        return {
          ...prev,
          [period]: prev[period].map(goal =>
            goal.id === updatedGoal.id ? updatedGoal : goal
          )
        };
      });
    } else if (changeType === 'DELETE' && payload.old) {
      const deletedGoalId = payload.old.goal_id;
      const period = payload.old.period as GoalPeriod;
      
      setGoals(prev => ({
        ...prev,
        [period]: prev[period].filter(goal => goal.id !== deletedGoalId)
      }));
    }
  };

  const loadGoalsFromLocalStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Ensure all periods exist with defaults
        const defaultGoals: GoalsByPeriod = {
          daily: [],
          weekly: [],
          monthly: [],
          quarterly: [],
          yearly: []
        };
        
        // Merge saved data with defaults
        const mergedGoals = { ...defaultGoals, ...parsed };
        
        // Convert date strings back to Date objects and handle legacy data without type field
        Object.keys(mergedGoals).forEach(period => {
          if (mergedGoals[period as keyof GoalsByPeriod]) {
            mergedGoals[period as keyof GoalsByPeriod] = mergedGoals[period as keyof GoalsByPeriod].map((goal: any) => ({
              ...goal,
              createdAt: new Date(goal.createdAt),
              type: goal.type || 'signal' // Default to signal for legacy goals
            }));
          }
        });
        
        setGoals(mergedGoals);
      } catch (error) {
        console.error('Failed to load goals from storage:', error);
      }
    }
    setIsLoaded(true);
  };

  const mergeSupabaseWithLocal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const supabaseGoals: GoalsByPeriod = {
          daily: [],
          weekly: [],
          monthly: [],
          quarterly: [],
          yearly: []
        };

        data.forEach((dbGoal) => {
          const goal: Goal = {
            id: dbGoal.goal_id,
            text: dbGoal.text,
            completed: dbGoal.completed,
            createdAt: new Date(dbGoal.created_at),
            type: dbGoal.type as TaskType
          };
          supabaseGoals[dbGoal.period as GoalPeriod].push(goal);
        });

        // Merge with local goals, prioritizing newer goals and avoiding duplicates
        setGoals(currentGoals => {
          const merged: GoalsByPeriod = { ...currentGoals };
          
          Object.keys(supabaseGoals).forEach(period => {
            const periodKey = period as GoalPeriod;
            const localGoals = merged[periodKey];
            const remoteGoals = supabaseGoals[periodKey];
            
            // Create a map of existing local goals by ID
            const localGoalsMap = new Map(localGoals.map(goal => [goal.id, goal]));
            
            // Add remote goals that don't exist locally
            remoteGoals.forEach(remoteGoal => {
              if (!localGoalsMap.has(remoteGoal.id)) {
                merged[periodKey].push(remoteGoal);
              }
            });
          });
          
          return merged;
        });
      }
    } catch (error) {
      console.error('Error merging Supabase data with local:', error);
    }
  };

  const addGoal = async (period: GoalPeriod, text: string) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date(),
      type: 'signal'
    };

    setGoals(prev => ({
      ...prev,
      [period]: [...prev[period], newGoal]
    }));

    // Sync to Supabase immediately
    if (user) {
      try {
        const { error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            period,
            goal_id: newGoal.id,
            text: newGoal.text,
            type: newGoal.type,
            completed: newGoal.completed
          });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error syncing new goal to Supabase:', error);
      }
    }
  };

  const toggleGoal = async (period: GoalPeriod, id: string) => {
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].map(goal =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    }));

    // Sync to Supabase immediately
    if (user) {
      try {
        const updatedGoal = goals[period].find(goal => goal.id === id);
        if (updatedGoal) {
          const { error } = await supabase
            .from('goals')
            .update({
              completed: !updatedGoal.completed
            })
            .eq('user_id', user.id)
            .eq('goal_id', id);
          
          if (error) throw error;
        }
      } catch (error) {
        console.error('Error syncing toggle to Supabase:', error);
      }
    }
  };

  const editGoal = async (period: GoalPeriod, id: string, newText: string, newType: TaskType) => {
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].map(goal =>
        goal.id === id ? { ...goal, text: newText.trim(), type: newType } : goal
      )
    }));

    // Sync to Supabase immediately
    if (user) {
      try {
        const { error } = await supabase
          .from('goals')
          .update({
            text: newText.trim(),
            type: newType
          })
          .eq('user_id', user.id)
          .eq('goal_id', id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error syncing edit to Supabase:', error);
      }
    }
  };

  const deleteGoal = async (period: GoalPeriod, id: string) => {
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].filter(goal => goal.id !== id)
    }));

    // Sync to Supabase immediately
    if (user) {
      try {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('user_id', user.id)
          .eq('goal_id', id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error syncing delete to Supabase:', error);
      }
    }
  };

  const moveGoal = async (goal: Goal, sourcePeriod: GoalPeriod, targetPeriod: GoalPeriod) => {
    if (sourcePeriod === targetPeriod) return;
    
    setGoals(prev => ({
      ...prev,
      [sourcePeriod]: prev[sourcePeriod].filter(g => g.id !== goal.id),
      [targetPeriod]: [...prev[targetPeriod], goal]
    }));

    // Sync to Supabase immediately
    if (user) {
      try {
        const { error } = await supabase
          .from('goals')
          .update({ period: targetPeriod })
          .eq('user_id', user.id)
          .eq('goal_id', goal.id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error syncing move to Supabase:', error);
      }
    }
  };

  // This function is no longer needed since we always merge data
  const migrateLocalStorageToSupabase = async () => {
    // Data is automatically synced when user signs in
    console.log('Data sync happens automatically when signing in');
  };

  return {
    goals,
    addGoal,
    toggleGoal,
    editGoal,
    deleteGoal,
    moveGoal,
    migrateLocalStorageToSupabase,
    isLoaded
  };
};