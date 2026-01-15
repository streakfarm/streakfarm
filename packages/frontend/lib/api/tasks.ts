import { apiClient } from './client';
import { ApiResponse } from '@streakfarm/shared/types/api';
import { UserTask } from '@streakfarm/shared/types/task';

export const tasksAPI = {
  async getTasks(): Promise<ApiResponse<UserTask[]>> {
    return apiClient.get('/tasks');
  },

  async startTask(taskId: string): Promise<ApiResponse<UserTask>> {
    return apiClient.post(`/tasks/${taskId}/start`);
  },

  async completeTask(taskId: string, verificationData?: any): Promise<ApiResponse<{ points_earned: number; task: UserTask }>> {
    return apiClient.post(`/tasks/${taskId}/complete`, { verification_data: verificationData });
  },
};
