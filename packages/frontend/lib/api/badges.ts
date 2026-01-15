import { apiClient } from './client';
import { ApiResponse } from '@streakfarm/shared/types/api';
import { UserBadge, BadgeProgress } from '@streakfarm/shared/types/badge';

export const badgesAPI = {
  async getUserBadges(): Promise<ApiResponse<UserBadge[]>> {
    return apiClient.get('/badges/me');
  },

  async getBadgeProgress(): Promise<ApiResponse<BadgeProgress[]>> {
    return apiClient.get('/badges/me/progress');
  },

  async claimBadge(badgeId: string): Promise<ApiResponse<UserBadge>> {
    return apiClient.post(`/badges/${badgeId}/claim`);
  },
};
