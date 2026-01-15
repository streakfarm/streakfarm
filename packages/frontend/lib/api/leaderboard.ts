import { apiClient } from './client';
import { ApiResponse } from '@streakfarm/shared/types/api';
import { LeaderboardData, LeaderboardType } from '@streakfarm/shared/types/leaderboard';

export const leaderboardAPI = {
  async getLeaderboard(type: LeaderboardType = LeaderboardType.GLOBAL): Promise<ApiResponse<LeaderboardData>> {
    return apiClient.get('/leaderboard', {
      params: { type },
    });
  },

  async getUserRank(): Promise<ApiResponse<{ global_rank: number; weekly_rank: number }>> {
    return apiClient.get('/leaderboard/me/rank');
  },
};
