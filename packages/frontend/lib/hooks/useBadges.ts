'use client';

import { useBadgeStore } from '@/lib/stores/useBadgeStore';

export function useBadges() {
  const { badges, isLoading, error, fetchBadges, claimBadge } = useBadgeStore();

  return {
    badges,
    isLoading,
    error,
    fetchBadges,
    claimBadge,
  };
}
