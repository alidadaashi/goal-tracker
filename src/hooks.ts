import { useState, useEffect } from 'react';
import { Goal, GoalPeriod, GoalsByPeriod, TaskType } from './types';

const STORAGE_KEY = 'goal-tracker-data';

export const useGoals = () => {
  const [goals, setGoals] = useState<GoalsByPeriod>({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    yearly: []
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoaded]);

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
  };

  const moveGoal = (goal: Goal, sourcePeriod: GoalPeriod, targetPeriod: GoalPeriod) => {
    if (sourcePeriod === targetPeriod) return;
    
    setGoals(prev => ({
      ...prev,
      [sourcePeriod]: prev[sourcePeriod].filter(g => g.id !== goal.id),
      [targetPeriod]: [...prev[targetPeriod], goal]
    }));
  };

  return {
    goals,
    addGoal,
    toggleGoal,
    editGoal,
    deleteGoal,
    moveGoal
  };
};