import { apiClient } from './client';
import type { User } from '@streakfarm/shared';

export async function authenticateTelegram(initData: string): Promise<{
  user: User;
  token: string;
}> {
  const result = await apiClient.post<{ user: User; token: string }>(
    '/auth/telegram',
    { initData }
  );
  
  apiClient.setToken(result.token);
  
  return result;
}

export async function verifyToken(): Promise<boolean> {
  try {
    await apiClient.get('/auth/verify');
    return true;
  } catch {
    return false;
  }
}

export function logout() {
  apiClient.clearToken();
}
