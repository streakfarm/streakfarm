'use client';

import { useUserStore } from '@/lib/stores/useUserStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Copy, ExternalLink } from 'lucide-react';
import { formatTonAddress } from '@/lib/ton/wallet';
import toast from 'react-hot-toast';

export function WalletInfo() {
  const user = useUserStore((state) => state.user);

  if (!user?.wallet_address) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(user.wallet_address!);
      toast.success('Wallet address copied!');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleViewOnExplorer = () => {
    const explorerUrl = `https://tonscan.org/address/${user.wallet_address}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500" />
          Connected Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
          <p className="font-mono font-semibold">
            {formatTonAddress(user.wallet_address)}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <Button onClick={handleViewOnExplorer} variant="outline" className="flex-1">
            <ExternalLink className="mr-2 h-4 w-4" />
            Explorer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
