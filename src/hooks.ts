import { useState, useEffect } from 'react';
import { Goal, GoalPeriod, GoalsByPeriod, TaskType } from './types';

const STORAGE_KEY = 'goal-tracker-data';

export const useGoals = () => {
  const [goals, setGoals] = useState<GoalsByPeriod>({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: []
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects and handle legacy data without type field
        Object.keys(parsed).forEach(period => {
          parsed[period] = parsed[period].map((goal: any) => ({
            ...goal,
            createdAt: new Date(goal.createdAt),
            type: goal.type || 'signal' // Default to signal for legacy goals
          }));
        });
        setGoals(parsed);
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

  return {
    goals,
    addGoal,
    toggleGoal,
    editGoal,
    deleteGoal
  };
};