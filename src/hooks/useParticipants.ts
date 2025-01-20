import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface Participant {
  id: string;
  username: string;
  created_at: string;
  challenge_participants: {
    joined_at: string;
  } | null;
  daily_logs_aggregate: {
    aggregate: {
      count: number;
      sum: number;
    };
  } | null;
  streak?: number;
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { session } = useAuthStore();

  const fetchParticipants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          created_at,
          challenge_participants!inner (
            joined_at
          ),
          daily_logs (
            points,
            workout_completed
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to calculate aggregates
      const processedParticipants = data?.map(participant => ({
        ...participant,
        daily_logs_aggregate: {
          aggregate: {
            count: participant.daily_logs?.filter(log => log.workout_completed).length || 0,
            sum: participant.daily_logs?.reduce((sum, log) => sum + (log.points || 0), 0) || 0
          }
        }
      })) || [];

      // Sort by points
      processedParticipants.sort((a, b) => 
        (b.daily_logs_aggregate?.aggregate.sum || 0) - (a.daily_logs_aggregate?.aggregate.sum || 0)
      );

      setParticipants(processedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkParticipation = useCallback(async () => {
    if (session?.user) {
      try {
        const { data, error } = await supabase
          .from('challenge_participants')
          .select()
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        setHasJoined(!!data);
      } catch (error) {
        console.error('Error checking participation:', error);
      }
    }
  }, [session]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchParticipants(),
      checkParticipation()
    ]);
    setLoading(false);
  }, [fetchParticipants, checkParticipation]);

  const handleJoinChallenge = async () => {
    if (!session?.user || hasJoined || isJoining) return;
    
    setIsJoining(true);
    try {
      // First ensure user exists in users table
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          username: session.user.user_metadata.username || session.user.email?.split('@')[0]
        });

      if (userError) throw userError;

      // Then join the challenge
      const { error } = await supabase
        .from('challenge_participants')
        .insert([{ user_id: session.user.id }]);
        
      if (error) throw error;
      
      setHasJoined(true);
      await refreshData();
    } catch (error) {
      console.error('Error joining challenge:', error);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    refreshData();
    
    // Set up real-time subscriptions for updates
    const dailyLogsSubscription = supabase
      .channel('daily_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => {
        refreshData();
      })
      .subscribe();

    const participantsSubscription = supabase
      .channel('participants_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_participants' }, () => {
        refreshData();
      })
      .subscribe();
    
    // Clean up subscriptions on unmount
    return () => {
      dailyLogsSubscription.unsubscribe();
      participantsSubscription.unsubscribe();
    };
  }, [refreshData]);

  return { 
    participants, 
    loading,
    hasJoined,
    isJoining,
    handleJoinChallenge,
    refreshData
  };
}