'use client';

import { useUserStore } from '@/lib/stores/useUserStore';

export function usePoints() {
  const { user } = useUserStore();

  return {
    totalPoints: user?.total_points || 0,
    multiplier: user?.total_multiplier || 1,
    baseMultiplier: user?.base_multiplier || 1,
    badgeMultiplier: user?.badge_multiplier || 0,
  };
}
