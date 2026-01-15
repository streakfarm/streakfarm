import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from '@streakfarm/shared/types/api';
import { Referral, ReferralStats } from '@streakfarm/shared/types/referral';

export const referralsAPI = {
  async getStats(): Promise<ApiResponse<ReferralStats>> {
    return apiClient.get('/referrals/stats');
  },

  async getReferrals(page = 1, perPage = 20): Promise<ApiResponse<PaginatedResponse<Referral>>> {
    return apiClient.get('/referrals', {
      params: { page, per_page: perPage },
    });
  },

  async generateLink(): Promise<ApiResponse<{ referral_link: string }>> {
    return apiClient.post('/referrals/generate-link');
  },
};
