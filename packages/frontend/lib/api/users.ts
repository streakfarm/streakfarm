import { apiClient } from './client';
import { ApiResponse } from '@streakfarm/shared/types/api';
import { User, UserStats } from '@streakfarm/shared/types/user';

export const usersAPI = {
  async getMe(): Promise<ApiResponse<User>> {
    return apiClient.get('/users/me');
  },

  async getUser(userId: string): Promise<ApiResponse<User>> {
    return apiClient.get(`/users/${userId}`);
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put('/users/me', data);
  },

  async getStats(): Promise<ApiResponse<UserStats>> {
    return apiClient.get('/users/me/stats');
  },

  async checkIn(): Promise<ApiResponse<{ points_earned: number; new_streak: number; milestone_reached: boolean }>> {
    return apiClient.post('/users/me/checkin');
  },
};
