import { useState, useEffect } from 'react';
import { GoalPeriod } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useColumnVisibility = (period: GoalPeriod) => {
  const { user } = useAuth();
  const getStorageKey = () => `goalSection_${period}_isBlurred`;
  
  const [isBlurred, setIsBlurred] = useState(() => {
    if (!user) {
      const saved = localStorage.getItem(getStorageKey());
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Load visibility from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadVisibilityFromSupabase();
    }
  }, [user, period]);

  // Save to localStorage when not authenticated
  useEffect(() => {
    if (!user) {
      localStorage.setItem(getStorageKey(), JSON.stringify(isBlurred));
    }
  }, [isBlurred, period, user]);

  const loadVisibilityFromSupabase = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('column_visibility')
        .select('is_blurred')
        .eq('user_id', user.id)
        .eq('period', period)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setIsBlurred(data.is_blurred);
      }
    } catch (error) {
      console.error('Error loading visibility from Supabase:', error);
    }
  };

  const saveVisibilityToSupabase = async (newIsBlurred: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('column_visibility')
        .upsert({
          user_id: user.id,
          period,
          is_blurred: newIsBlurred
        }, {
          onConflict: 'user_id,period'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving visibility to Supabase:', error);
    }
  };

  const toggleBlurred = async () => {
    const newIsBlurred = !isBlurred;
    setIsBlurred(newIsBlurred);
    
    if (user) {
      await saveVisibilityToSupabase(newIsBlurred);
    } else {
      localStorage.setItem(getStorageKey(), JSON.stringify(newIsBlurred));
    }
  };

  return {
    isBlurred,
    toggleBlurred
  };
};