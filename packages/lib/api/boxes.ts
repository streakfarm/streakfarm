import { apiClient } from './client';
import type { Box, BoxOpenResult } from '@streakfarm/shared';

export async function getAvailableBoxes(): Promise<Box[]> {
  return apiClient.get<Box[]>('/boxes/available');
}

export async function openBox(boxId: string): Promise<BoxOpenResult> {
  return apiClient.post<BoxOpenResult>('/boxes/open', { box_id: boxId });
}

export async function getBoxHistory(limit: number = 20): Promise<Box[]> {
  return apiClient.get<Box[]>(`/boxes/history?limit=${limit}`);
}

export async function getBoxStats(): Promise<any> {
  return apiClient.get('/boxes/stats');
}
