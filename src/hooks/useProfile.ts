import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './useTelegram';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect, useState } from 'react';

export interface Profile {
  id: string;
  user_id: string;
  telegram_id: number | null;
  username: string | null;
  first_name: string | null;
  avatar_url: string | null;
  raw_points: number;
  streak_current: number;
  streak_best: number;
  last_checkin: string | null;
  total_boxes_opened: number;
  total_tasks_completed: number;
  total_referrals: number;
  wallet_address: string | null;
  wallet_type: string | null;
  ref_code: string;
  multiplier_permanent: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  points_all_time: number;
  points_weekly: number;
  rank_all_time: number | null;
  rank_weekly: number | null;
  badge_count: number;
  referral_count: number;
}

export function useProfile() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [initialProfile, setInitialProfile] = useState<Profile | null>(null);

  // Try to get profile from auth session metadata first (instant load)
  useEffect(() => {
    if (authUser?.id) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.user_metadata?.profile) {
          setInitialProfile(session.user.user_metadata.profile as Profile);
        }
      });
    }
  }, [authUser?.id]);

  // Fetch profile with caching strategy
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!authUser?.id,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    initialData: initialProfile || undefined,
  });

  // Fetch leaderboard entry with caching
  const { data: leaderboardEntry } = useQuery({
    queryKey: ['leaderboard-entry', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('user_id', profile.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as LeaderboardEntry | null;
    },
    enabled: !!profile?.id,
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch multiplier with caching
  const { data: totalMultiplier } = useQuery({
    queryKey: ['multiplier', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 1;
      
      const { data, error } = await supabase
        .rpc('calculate_user_multiplier', { _profile_id: profile.id });
      
      if (error) throw error;
      return data as number;
    },
    enabled: !!profile?.id,
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Only allow safe profile updates (non-game-critical fields)
  const updateProfile = useMutation({
    mutationFn: async (updates: { wallet_address?: string | null; wallet_type?: string | null }) => {
      if (!profile?.id) throw new Error('No profile');
      
      // Only allow wallet-related fields for client-side updates
      const safeUpdates: { wallet_address?: string | null; wallet_type?: string | null } = {};
      
      if ('wallet_address' in updates) {
        safeUpdates.wallet_address = updates.wallet_address;
      }
      if ('wallet_type' in updates) {
        safeUpdates.wallet_type = updates.wallet_type;
      }
      
      if (Object.keys(safeUpdates).length === 0) {
        throw new Error('No valid fields to update');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    leaderboardEntry,
    totalMultiplier: totalMultiplier || 1,
    isLoading: isLoading && !initialProfile, // Show loading only if no initial data
    error,
    updateProfile,
    isAuthenticated: !!authUser,
  };
}
