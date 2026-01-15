'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/stores/useUserStore';
import { walletAPI } from '@/lib/api/wallet';

export function useWallet() {
  const { user, fetchUser } = useUserStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async (address: string, proof: any) => {
    setIsConnecting(true);
    try {
      const response = await walletAPI.connectWallet(address, proof);
      if (response.success) {
        await fetchUser();
        return response.data;
      }
      throw new Error(response.error?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    const response = await walletAPI.disconnectWallet();
    if (response.success) {
      await fetchUser();
    }
  };

  return {
    isConnected: user?.wallet_connected || false,
    walletAddress: user?.wallet_address,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };
}
