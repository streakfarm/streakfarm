'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function WalletConnect() {
  const handleConnect = () => {
    toast.error('TON Connect integration coming soon!');
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <Wallet className="h-8 w-8 text-blue-500" />
        </div>
        <CardTitle>Connect TON Wallet</CardTitle>
        <CardDescription>
          Connect your TON wallet to unlock blockchain features and earn extra rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Benefits:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Earn 2,000 bonus points
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Unlock exclusive wallet tasks
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Future token airdrops
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              NFT rewards for achievements
            </li>
          </ul>
        </div>

        <Button onClick={handleConnect} className="w-full" size="lg">
          <Zap className="mr-2 h-5 w-5" />
          Connect Wallet
        </Button>
      </CardContent>
    </Card>
  );
}
