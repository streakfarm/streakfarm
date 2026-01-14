import { apiClient } from './client';
import type { User } from '@streakfarm/shared';

export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/users/me');
}

export async function getUserStats(): Promise<any> {
  return apiClient.get('/users/me/stats');
}

export async function updateUser(updates: Partial<User>): Promise<User> {
  return apiClient.put<User>('/users/me', updates);
}

export async function connectWallet(
  walletAddress: string,
  walletType: string
): Promise<{ success: boolean; bonus: number }> {
  return apiClient.post('/users/wallet', { wallet_address: walletAddress, wallet_type: walletType });
}

export async function disconnectWallet(): Promise<void> {
  return apiClient.delete('/users/wallet');
}
