import { apiClient } from './client';
import type { Task, TaskWithCompletion } from '@streakfarm/shared';

export async function getTasks(): Promise<TaskWithCompletion[]> {
  return apiClient.get<TaskWithCompletion[]>('/tasks');
}

export async function completeTask(
  taskId: string,
  metadata?: any
): Promise<{ points: number; task: Task }> {
  return apiClient.post<{ points: number; task: Task }>(
    '/tasks/complete',
    { task_id: taskId, metadata }
  );
}
