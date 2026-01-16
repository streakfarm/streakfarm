import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './useTelegram';
import { useEffect } from 'react';

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
  const { user, isReady } = useTelegram();
  const queryClient = useQueryClient();

  // For development, we'll use a mock auth session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!session?.user?.id,
  });

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
  });

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
    isLoading,
    error,
    updateProfile,
    isAuthenticated: !!session?.user,
  };
}
