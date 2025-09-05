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

  // Load goals from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadGoalsFromSupabase();
    } else {
      // Load from localStorage if not authenticated
      loadGoalsFromLocalStorage();
    }
  }, [user]);

  const loadGoalsFromSupabase = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const goalsByPeriod: GoalsByPeriod = {
        daily: [],
        weekly: [],
        monthly: [],
        quarterly: [],
        yearly: []
      };

      data?.forEach((dbGoal) => {
        const goal: Goal = {
          id: dbGoal.goal_id,
          text: dbGoal.text,
          completed: dbGoal.completed,
          createdAt: new Date(dbGoal.created_at),
          type: dbGoal.type as TaskType
        };
        goalsByPeriod[dbGoal.period as keyof GoalsByPeriod].push(goal);
      });

      setGoals(goalsByPeriod);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading goals from Supabase:', error);
      // Fallback to localStorage
      loadGoalsFromLocalStorage();
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

  // Save to localStorage for offline support
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoaded, user]);

  const saveGoalToSupabase = async (goal: Goal, period: GoalPeriod, action: 'insert' | 'update' | 'delete') => {
    if (!user) return;

    try {
      if (action === 'insert') {
        const { error } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            period,
            goal_id: goal.id,
            text: goal.text,
            type: goal.type,
            completed: goal.completed
          });
        if (error) throw error;
      } else if (action === 'update') {
        const { error } = await supabase
          .from('goals')
          .update({
            text: goal.text,
            type: goal.type,
            completed: goal.completed
          })
          .eq('user_id', user.id)
          .eq('goal_id', goal.id);
        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('user_id', user.id)
          .eq('goal_id', goal.id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving goal to Supabase:', error);
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

    await saveGoalToSupabase(newGoal, period, 'insert');
  };

  const toggleGoal = async (period: GoalPeriod, id: string) => {
    let updatedGoal: Goal | null = null;
    
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].map(goal => {
        if (goal.id === id) {
          updatedGoal = { ...goal, completed: !goal.completed };
          return updatedGoal;
        }
        return goal;
      })
    }));

    if (updatedGoal) {
      await saveGoalToSupabase(updatedGoal, period, 'update');
    }
  };

  const editGoal = async (period: GoalPeriod, id: string, newText: string, newType: TaskType) => {
    let updatedGoal: Goal | null = null;
    
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].map(goal => {
        if (goal.id === id) {
          updatedGoal = { ...goal, text: newText.trim(), type: newType };
          return updatedGoal;
        }
        return goal;
      })
    }));

    if (updatedGoal) {
      await saveGoalToSupabase(updatedGoal, period, 'update');
    }
  };

  const deleteGoal = async (period: GoalPeriod, id: string) => {
    const goalToDelete = goals[period].find(goal => goal.id === id);
    
    setGoals(prev => ({
      ...prev,
      [period]: prev[period].filter(goal => goal.id !== id)
    }));

    if (goalToDelete) {
      await saveGoalToSupabase(goalToDelete, period, 'delete');
    }
  };

  const moveGoal = async (goal: Goal, sourcePeriod: GoalPeriod, targetPeriod: GoalPeriod) => {
    if (sourcePeriod === targetPeriod) return;
    
    setGoals(prev => ({
      ...prev,
      [sourcePeriod]: prev[sourcePeriod].filter(g => g.id !== goal.id),
      [targetPeriod]: [...prev[targetPeriod], goal]
    }));

    // Update in Supabase: delete from source period and insert to target period
    if (user) {
      try {
        await supabase
          .from('goals')
          .update({ period: targetPeriod })
          .eq('user_id', user.id)
          .eq('goal_id', goal.id);
      } catch (error) {
        console.error('Error moving goal in Supabase:', error);
      }
    }
  };

  // Migration function to move localStorage data to Supabase
  const migrateLocalStorageToSupabase = async () => {
    if (!user) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const migrations = [];

      for (const [period, periodGoals] of Object.entries(parsed)) {
        if (Array.isArray(periodGoals)) {
          for (const goal of periodGoals) {
            migrations.push({
              user_id: user.id,
              period: period as GoalPeriod,
              goal_id: goal.id,
              text: goal.text,
              type: goal.type || 'signal',
              completed: goal.completed || false
            });
          }
        }
      }

      if (migrations.length > 0) {
        const { error } = await supabase
          .from('goals')
          .insert(migrations);
        
        if (!error) {
          console.log('Successfully migrated localStorage data to Supabase');
          // Optionally clear localStorage after successful migration
          // localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error migrating localStorage to Supabase:', error);
    }
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