import { create } from 'zustand';
import { UserBadge } from '@streakfarm/shared/types/badge';
import { badgesAPI } from '@/lib/api/badges';

interface BadgeState {
  badges: UserBadge[];
  isLoading: boolean;
  error: string | null;

  fetchBadges: () => Promise<void>;
  claimBadge: (badgeId: string) => Promise<void>;
}

export const useBadgeStore = create<BadgeState>((set) => ({
  badges: [],
  isLoading: false,
  error: null,

  fetchBadges: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await badgesAPI.getUserBadges();
      if (response.success && response.data) {
        set({ badges: response.data, isLoading: false });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch badges');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  claimBadge: async (badgeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await badgesAPI.claimBadge(badgeId);
      if (response.success && response.data) {
        set((state) => ({
          badges: state.badges.map((b) => (b.badge_id === badgeId ? response.data! : b)),
          isLoading: false,
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to claim badge');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
