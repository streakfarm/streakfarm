import { apiClient } from './client';
import { ApiResponse } from '@streakfarm/shared/types/api';

export const walletAPI = {
  async connectWallet(walletAddress: string, proof: any): Promise<ApiResponse<{ success: boolean; points_earned: number }>> {
    return apiClient.post('/wallet/connect', {
      wallet_address: walletAddress,
      proof,
    });
  },

  async disconnectWallet(): Promise<ApiResponse<void>> {
    return apiClient.post('/wallet/disconnect');
  },

  async getBalance(): Promise<ApiResponse<{ balance: string; formatted: string }>> {
    return apiClient.get('/wallet/balance');
  },
};
