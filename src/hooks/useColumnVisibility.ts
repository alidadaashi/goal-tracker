import { useState, useEffect } from 'react';
import { GoalPeriod } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useColumnVisibility = (period: GoalPeriod) => {
  const { user } = useAuth();
  const getStorageKey = () => `goalSection_${period}_isBlurred`;
  
  // Always start with localStorage value (local-first)
  const [isBlurred, setIsBlurred] = useState(() => {
    const saved = localStorage.getItem(getStorageKey());
    return saved ? JSON.parse(saved) : false;
  });

  // Always save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(isBlurred));
  }, [isBlurred, period]);

  // When user signs in, merge with Supabase and sync
  useEffect(() => {
    if (user) {
      mergeWithSupabase();
    }
  }, [user, period]);

  // Sync to Supabase when authenticated and state changes
  useEffect(() => {
    if (user) {
      syncToSupabase();
    }
  }, [isBlurred, user, period]);

  // Set up real-time subscription for column visibility
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('column_visibility_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'column_visibility',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          if (payload.new && payload.new.period === period) {
            // Update local state if remote change is different
            if (payload.new.is_blurred !== isBlurred) {
              setIsBlurred(payload.new.is_blurred);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, period, isBlurred]);

  const mergeWithSupabase = async () => {
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

      // If there's remote data and it's different from local, keep local preference (local-first)
      if (data && data.is_blurred !== isBlurred) {
        console.log(`Column ${period} visibility: keeping local preference (${isBlurred}), remote was (${data.is_blurred})`);
      }
    } catch (error) {
      console.error('Error loading visibility from Supabase:', error);
    }
  };

  const syncToSupabase = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('column_visibility')
        .upsert({
          user_id: user.id,
          period,
          is_blurred: isBlurred
        }, {
          onConflict: 'user_id,period'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving visibility to Supabase:', error);
    }
  };

  const toggleBlurred = () => {
    setIsBlurred(!isBlurred);
  };

  return {
    isBlurred,
    toggleBlurred
  };
};