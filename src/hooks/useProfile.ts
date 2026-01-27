import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

// Cache session to prevent repeated calls
let cachedSession: { user?: { id: string } } | null = null;

export function useProfile() {
  const queryClient = useQueryClient();

  // Get session once and cache it
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      if (cachedSession) return cachedSession;
      const { data } = await supabase.auth.getSession();
      cachedSession = data.session;
      return data.session;
    },
    staleTime: Infinity, // Don't refetch session
    cacheTime: Infinity,
  });

  const userId = session?.user?.id;

  // Fetch profile only when we have userId
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      console.log('[useProfile] Fetching profile for:', userId.slice(0, 8));
      
      // Use maybeSingle() instead of single() to handle case when profile doesn't exist yet
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[useProfile] Error:', error.message);
        throw error;
      }
      
      if (!data) {
        console.log('[useProfile] Profile not found yet, will retry...');
        // Return null to trigger retry
        throw new Error('Profile not found');
      }
      
      console.log('[useProfile] Profile fetched:', data?.username);
      return data as Profile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Retry up to 5 times if profile not found (race condition with trigger)
      if (error?.message === 'Profile not found' && failureCount < 5) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000), // Exponential backoff
  });

  // Fetch leaderboard entry
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
    staleTime: 5 * 60 * 1000,
  });

  // Calculate multiplier
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
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: { wallet_address?: string | null; wallet_type?: string | null }) => {
      if (!profile?.id) throw new Error('No profile');
      
      const safeUpdates: { wallet_address?: string | null; wallet_type?: string | null } = {};
      
      if ('wallet_address' in updates) safeUpdates.wallet_address = updates.wallet_address;
      if ('wallet_type' in updates) safeUpdates.wallet_type = updates.wallet_type;
      
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
