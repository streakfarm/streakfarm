import { apiClient } from './client';
import { ApiResponse, PaginatedResponse } from '@streakfarm/shared/types/api';
import { Box, BoxOpenResult } from '@streakfarm/shared/types/box';

export const boxesAPI = {
  async getAvailableBoxes(): Promise<ApiResponse<Box[]>> {
    return apiClient.get('/boxes/available');
  },

  async openBox(boxId: string): Promise<ApiResponse<BoxOpenResult>> {
    return apiClient.post(`/boxes/${boxId}/open`);
  },

  async getBoxHistory(page = 1, perPage = 20): Promise<ApiResponse<PaginatedResponse<Box>>> {
    return apiClient.get('/boxes/history', {
      params: { page, per_page: perPage },
    });
  },
};
