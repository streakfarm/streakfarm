'use client';

import { WalletConnect } from '@/components/features/wallet/WalletConnect';
import { WalletInfo } from '@/components/features/wallet/WalletInfo';
import { WalletTasks } from '@/components/features/wallet/WalletTasks';
import { useUserStore } from '@/lib/stores/useUserStore';

export default function WalletPage() {
  const user = useUserStore((state) => state.user);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">TON Wallet 👛</h1>
        <p className="text-muted-foreground">
          Connect your wallet to unlock blockchain features
        </p>
      </div>

      {user?.wallet_connected ? (
        <>
          <WalletInfo />
          <WalletTasks />
        </>
      ) : (
        <WalletConnect />
      )}
    </div>
  );
}
