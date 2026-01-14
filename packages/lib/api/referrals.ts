
import { apiClient } from './client';
import type { ReferralStats } from '@streakfarm/shared';

export async function getReferralStats(): Promise<ReferralStats> {
  return apiClient.get<ReferralStats>('/referrals/stats');
}

export async function getReferralList(limit: number = 50): Promise<any[]> {
  return apiClient.get(`/referrals/list?limit=${limit}`);
}
