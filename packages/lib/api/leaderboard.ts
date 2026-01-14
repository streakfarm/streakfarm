import { apiClient } from './client';
import type { LeaderboardEntry, LeaderboardType } from '@streakfarm/shared';

export async function getLeaderboard(
  type: LeaderboardType = 'global',
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  return apiClient.get<LeaderboardEntry[]>(
    `/leaderboard/${type}?limit=${limit}`
  );
}

export async function getUserRank(): Promise<{ rank: number }> {
  return apiClient.get<{ rank: number }>('/leaderboard/rank/me');
}
