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
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      if (cachedSession) return cachedSession;
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[useProfile] Session error:', error);
        throw error;
      }
      cachedSession = data.session;
      return data.session;
    },
    staleTime: Infinity,
    retry: false,
  });

  const userId = session?.user?.id;

  // Fetch profile only when we have userId
  const { 
    data: profile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('[useProfile] No userId, returning null');
        return null;
      }
      
      console.log('[useProfile] Fetching profile for user:', userId.slice(0, 8));
      
      try {
        // First try to get profile by user_id
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('[useProfile] Database error:', error.message, error.code);
          throw new Error(`Database error: ${error.message}`);
        }
        
        if (data) {
          console.log('[useProfile] Profile found:', data.username || 'no-username');
          return data as Profile;
        }
        
        // No profile found - this could be a race condition with the trigger
        console.log('[useProfile] Profile not found, may need to retry');
        
        // Try to create profile manually if it doesn't exist
        console.log('[useProfile] Attempting to create profile...');
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: userId })
          .select()
          .maybeSingle();
        
        if (insertError) {
          // Profile might already exist (race condition), try fetching again
          if (insertError.code === '23505') { // Unique violation
            console.log('[useProfile] Profile already exists (race condition), fetching again...');
            const { data: retryData, error: retryError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            
            if (retryError) {
              throw new Error(`Retry fetch error: ${retryError.message}`);
            }
            
            if (retryData) {
              return retryData as Profile;
            }
          }
          
          console.error('[useProfile] Insert error:', insertError.message);
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
        
        if (newProfile) {
          console.log('[useProfile] Profile created successfully');
          return newProfile as Profile;
        }
        
        throw new Error('Profile not found and could not be created');
        
      } catch (err: any) {
        console.error('[useProfile] Error in profile fetch:', err.message);
        throw err;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Retry up to 3 times for race conditions
      if (failureCount < 3) {
        console.log(`[useProfile] Retrying profile fetch (attempt ${failureCount + 1})...`);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 4000),
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
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[useProfile] Leaderboard error:', error.message);
        throw error;
      }
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
      
      try {
        const { data, error } = await supabase
          .rpc('calculate_user_multiplier', { _profile_id: profile.id });
        
        if (error) {
          console.error('[useProfile] Multiplier error:', error.message);
          return 1;
        }
        return data as number;
      } catch (e) {
        return 1;
      }
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
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const isLoading = isSessionLoading || isProfileLoading;

  return {
    profile,
    leaderboardEntry,
    totalMultiplier: totalMultiplier || 1,
    isLoading,
    error: profileError,
    updateProfile,
    isAuthenticated: !!session?.user,
  };
}
