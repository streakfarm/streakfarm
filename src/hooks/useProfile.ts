import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './useTelegram';
import { useAuth } from '@/providers/AuthProvider';

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
  wallet_connected_at: string | null;
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

// Cache configuration
const PROFILE_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 30 * 1000; // 30 seconds

export function useProfile() {
  const { user, isReady } = useTelegram();
  const { user: authUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Get profile with optimized caching
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    isFetching: profileFetching 
  } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!authUser?.id && isAuthenticated,
    staleTime: STALE_TIME,
    gcTime: PROFILE_CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Get leaderboard entry - parallel query
  const { 
    data: leaderboardEntry,
    isLoading: leaderboardLoading 
  } = useQuery({
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
    staleTime: STALE_TIME,
    gcTime: PROFILE_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Get total multiplier - parallel query
  const { 
    data: totalMultiplier,
    isLoading: multiplierLoading 
  } = useQuery({
    queryKey: ['multiplier', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 1;
      
      const { data, error } = await supabase
        .rpc('calculate_user_multiplier', { _profile_id: profile.id });
      
      if (error) throw error;
      return data as number;
    },
    enabled: !!profile?.id,
    staleTime: STALE_TIME * 2, // Multiplier changes less frequently
    gcTime: PROFILE_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Get referral stats - parallel query
  const { 
    data: referralStats,
    isLoading: referralLoading 
  } = useQuery({
    queryKey: ['referral-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { count: 0, earned: 0 };
      
      // Get actual referral count from referrals table
      const { count, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', profile.id)
        .eq('is_valid', true);
      
      if (error) throw error;
      
      return { 
        count: count || 0,
        earned: (count || 0) * 1000 // 1000 points per referral
      };
    },
    enabled: !!profile?.id,
    staleTime: STALE_TIME,
    gcTime: PROFILE_CACHE_TIME,
    refetchOnWindowFocus: false,
  });

  // Optimistic update for profile
  const updateProfile = useMutation({
    mutationFn: async (updates: { 
      wallet_address?: string | null; 
      wallet_type?: string | null;
      first_name?: string;
      username?: string;
      avatar_url?: string;
    }) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] });
      
      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(['profile', authUser?.id]);
      
      // Optimistically update
      queryClient.setQueryData(['profile', authUser?.id], (old: Profile | undefined) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
      
      return { previousProfile };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', authUser?.id], context.previousProfile);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Refresh profile data
  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    await queryClient.invalidateQueries({ queryKey: ['leaderboard-entry'] });
    await queryClient.invalidateQueries({ queryKey: ['multiplier'] });
    await queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
  };

  const isLoading = profileLoading || leaderboardLoading || multiplierLoading || referralLoading;

  return {
    profile,
    leaderboardEntry,
    totalMultiplier: totalMultiplier || 1,
    referralStats: referralStats || { count: profile?.total_referrals || 0, earned: (profile?.total_referrals || 0) * 1000 },
    isLoading,
    isFetching: profileFetching,
    error: profileError,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!authUser && isAuthenticated,
  };
}
