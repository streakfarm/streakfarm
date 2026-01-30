import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string;
  image_url: string | null;
  badge_category: 'streak' | 'achievement' | 'wallet' | 'special';
  multiplier: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  requirements: Record<string, unknown> | null;
  max_supply: number | null;
  current_supply: number;
  is_active: boolean;
  sort_order: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  expires_at: string | null;
  is_active: boolean;
  badge?: Badge;
}

export function useBadges() {
  const { profile } = useProfile();

  const { data: allBadges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Badge[];
    },
  });

  const { data: userBadges = [], isLoading: userBadgesLoading } = useQuery({
    queryKey: ['user-badges', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', profile.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data as (UserBadge & { badge: Badge })[];
    },
    enabled: !!profile?.id,
  });

  const ownedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  
  const ownedBadges = userBadges.map(ub => ({
    ...ub.badge,
    earnedAt: ub.earned_at,
    userBadgeId: ub.id,
  }));

  const availableBadges = allBadges.filter(badge => !ownedBadgeIds.has(badge.id));

  const totalMultiplier = userBadges.reduce((sum, ub) => {
    return sum + (ub.badge?.multiplier || 0) - 1; // Subtract 1 because multipliers are like 1.2x, 1.5x
  }, 1);

  const badgesByCategory = {
    streak: allBadges.filter(b => b.badge_category === 'streak'),
    achievement: allBadges.filter(b => b.badge_category === 'achievement'),
    wallet: allBadges.filter(b => b.badge_category === 'wallet'),
    special: allBadges.filter(b => b.badge_category === 'special'),
  };

  return {
    allBadges,
    userBadges,
    ownedBadges,
    availableBadges,
    ownedBadgeIds,
    totalMultiplier,
    badgesByCategory,
    isLoading: badgesLoading || userBadgesLoading,
    badgeCount: userBadges.length,
  };
}
