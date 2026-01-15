import { apiClient } from './client';
import { ApiResponse } from '@streakfarm/shared/types/api';
import { User } from '@streakfarm/shared/types/user';

export const authAPI = {
  async login(initData: string): Promise<ApiResponse<{ user: User; token: string; is_new_user: boolean }>> {
    const response = await apiClient.post('/auth/login', { init_data: initData });
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiClient.post('/auth/logout');
    apiClient.clearToken();
    return response;
  },

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/auth/refresh');
  },
};
