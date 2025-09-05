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

  // Sync to Supabase whenever goals change (if user is authenticated)
  useEffect(() => {
    if (user && isLoaded) {
      syncToSupabase();
    }
  }, [goals, user, isLoaded]);

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
          supabaseGoals[dbGoal.period].push(goal);
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

  const syncToSupabase = async () => {
    if (!user) return;

    try {
      // Get current state from Supabase
      const { data: existingData, error: fetchError } = await supabase
        .from('goals')
        .select('goal_id')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const existingGoalIds = new Set(existingData?.map(g => g.goal_id) || []);
      const currentGoals = [];

      // Prepare all current local goals for sync
      Object.entries(goals).forEach(([period, periodGoals]) => {
        periodGoals.forEach(goal => {
          currentGoals.push({
            user_id: user.id,
            period: period as GoalPeriod,
            goal_id: goal.id,
            text: goal.text,
            type: goal.type,
            completed: goal.completed
          });
        });
      });

      // Insert new goals (ones that don't exist in Supabase)
      const newGoals = currentGoals.filter(goal => !existingGoalIds.has(goal.goal_id));
      if (newGoals.length > 0) {
        const { error: insertError } = await supabase
          .from('goals')
          .insert(newGoals);
        
        if (insertError) throw insertError;
      }

      // Update existing goals
      const existingGoals = currentGoals.filter(goal => existingGoalIds.has(goal.goal_id));
      for (const goal of existingGoals) {
        const { error: updateError } = await supabase
          .from('goals')
          .update({
            text: goal.text,
            type: goal.type,
            completed: goal.completed
          })
          .eq('user_id', user.id)
          .eq('goal_id', goal.goal_id);
        
        if (updateError) throw updateError;
      }

    } catch (error) {
      console.error('Error syncing to Supabase:', error);
    }
  };

  const addGoal = (period: GoalPeriod, text: string) => {
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
  };

  const toggleGoal = (period: GoalPeriod, id: string) => {
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].map(goal =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    }));
  };

  const editGoal = (period: GoalPeriod, id: string, newText: string, newType: TaskType) => {
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].map(goal =>
        goal.id === id ? { ...goal, text: newText.trim(), type: newType } : goal
      )
    }));
  };

  const deleteGoal = (period: GoalPeriod, id: string) => {
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].filter(goal => goal.id !== id)
    }));

    // If user is authenticated, also delete from Supabase
    if (user) {
      supabase
        .from('goals')
        .delete()
        .eq('user_id', user.id)
        .eq('goal_id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting goal from Supabase:', error);
        });
    }
  };

  const moveGoal = (goal: Goal, sourcePeriod: GoalPeriod, targetPeriod: GoalPeriod) => {
    if (sourcePeriod === targetPeriod) return;
    
    setGoals(prev => ({
      ...prev,
      [sourcePeriod]: prev[sourcePeriod].filter(g => g.id !== goal.id),
      [targetPeriod]: [...prev[targetPeriod], goal]
    }));
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