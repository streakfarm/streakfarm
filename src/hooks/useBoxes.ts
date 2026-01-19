import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Box {
  id: string;
  user_id: string;
  rarity: 'common' | 'rare' | 'legendary';
  base_points: number;
  final_points: number | null;
  multiplier_applied: number | null;
  generated_at: string;
  expires_at: string;
  opened_at: string | null;
  is_expired: boolean;
}

export function useBoxes() {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: ['boxes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_expired', false)
        .is('opened_at', null)
        .order('generated_at', { ascending: false });
      
      if (error) throw error;
      return data as Box[];
    },
    enabled: !!profile?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: openedBoxes = [] } = useQuery({
    queryKey: ['opened-boxes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('user_id', profile.id)
        .not('opened_at', 'is', null)
        .order('opened_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Box[];
    },
    enabled: !!profile?.id,
  });

  const { data: expiredCount = 0 } = useQuery({
    queryKey: ['expired-boxes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;
      
      const { count, error } = await supabase
        .from('boxes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_expired', true);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id,
  });

  const openBox = useMutation({
    mutationFn: async (boxId: string) => {
      // Get current session for auth header
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Call server-side Edge Function for secure box opening
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/open-box`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ boxId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to open box');
      }

      // Return the box data from the server response
      return {
        id: result.box.id,
        rarity: result.box.rarity,
        base_points: result.box.base_points,
        multiplier_applied: result.box.multiplier_applied,
        final_points: result.box.final_points,
        user_id: profile!.id,
        generated_at: '',
        expires_at: '',
        opened_at: new Date().toISOString(),
        is_expired: false,
      } as Box;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boxes'] });
      queryClient.invalidateQueries({ queryKey: ['opened-boxes'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const availableBoxes = boxes.filter(box => !box.opened_at && !box.is_expired);
  const nextBoxTime = getNextBoxTime();

  return {
    boxes: availableBoxes,
    openedBoxes,
    expiredCount,
    isLoading,
    openBox,
    availableCount: availableBoxes.length,
    nextBoxTime,
  };
}

function getNextBoxTime(): Date {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour;
}
