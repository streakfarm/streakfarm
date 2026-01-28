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

export function useProfile() {
  const queryClient = useQueryClient();

  // Get session
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: Infinity,
  });

  const userId = session?.user?.id;

  // Fetch profile
  const { 
    data: profile, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      console.log('[useProfile] Fetching profile for:', userId.slice(0, 8));
      
      // Try to get profile - use maybeSingle to handle case when profile doesn't exist
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[useProfile] Error fetching profile:', error.message);
        throw error;
      }
      
      if (data) {
        console.log('[useProfile] Profile found:', data.username);
        return data as Profile;
      }
      
      // Profile doesn't exist - try to create it
      console.log('[useProfile] Profile not found, creating...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ user_id: userId })
        .select()
        .maybeSingle();
      
      if (createError) {
        // If unique violation, profile was created by trigger - fetch again
        if (createError.code === '23505') {
          console.log('[useProfile] Profile exists (created by trigger), fetching...');
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (fetchError) throw fetchError;
          return existingProfile as Profile;
        }
        throw createError;
      }
      
      console.log('[useProfile] Profile created:', newProfile?.username);
      return newProfile as Profile;
    },
    enabled: !!userId,
    retry: 3,
    retryDelay: 1000,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!profile?.id) throw new Error('No profile');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
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

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isAuthenticated: !!session?.user,
  };
}
