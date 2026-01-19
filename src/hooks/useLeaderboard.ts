import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  points_all_time: number | null;
  points_weekly: number | null;
  rank_all_time: number | null;
  rank_weekly: number | null;
  badge_count: number | null;
  referral_count: number | null;
  profile?: {
    username: string | null;
    first_name: string | null;
    avatar_url: string | null;
  };
}

export type LeaderboardType = 'all_time' | 'weekly' | 'badges' | 'referrals';

export function useLeaderboard(type: LeaderboardType = 'all_time', limit = 100) {
  const { profile } = useProfile();

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async () => {
      let orderColumn = 'points_all_time';
      let rankColumn = 'rank_all_time';
      
      switch (type) {
        case 'weekly':
          orderColumn = 'points_weekly';
          rankColumn = 'rank_weekly';
          break;
        case 'badges':
          orderColumn = 'badge_count';
          rankColumn = 'rank_badges';
          break;
        case 'referrals':
          orderColumn = 'referral_count';
          rankColumn = 'rank_referrals';
          break;
      }

      const { data, error } = await supabase
        .from('leaderboards')
        .select(`
          *,
          profile:profiles!leaderboards_user_id_fkey (
            username,
            first_name,
            avatar_url
          )
        `)
        .order(orderColumn, { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;

      // Add ranks based on order
      return (data || []).map((entry, index) => ({
        ...entry,
        computed_rank: index + 1,
      }));
    },
  });

  const { data: userRank } = useQuery({
    queryKey: ['user-rank', profile?.id, type],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return {
    leaderboard,
    userRank,
    isLoading,
  };
}
