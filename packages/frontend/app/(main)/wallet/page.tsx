'use client';

import { useState } from 'react';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { Wallet, ExternalLink, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useUIStore } from '@/lib/stores/useUIStore';
import { connectWallet, disconnectWallet } from '@/lib/api/users';

export default function WalletPage() {
  const { user, setUser } = useUserStore();
  const { showToast } = useUIStore();
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();
  
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleConnect = async () => {
    if (!walletAddress) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const result = await connectWallet(walletAddress, 'TON Connect');
      
      if (user) {
        setUser({
          ...user,
          wallet_address: walletAddress,
          wallet_type: 'TON Connect',
          wallet_connected_at: new Date(),
        });
      }
      
      showToast(`Connected! +${result.bonus} points bonus`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to connect wallet', 'error');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      await tonConnectUI.disconnect();
      
      if (user) {
        setUser({
          ...user,
          wallet_address: null,
          wallet_type: null,
          wallet_connected_at: null,
        });
      }
      
      showToast('Wallet disconnected', 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to disconnect', 'error');
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Wallet</h1>
        <p className="text-muted-foreground">
          Connect TON wallet for exclusive features
        </p>
      </div>
      
      {!user?.wallet_address ? (
        <>
          {/* Benefits */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Connect Wallet Benefits</h3>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="text-xl">🎁</div>
                <div>
                  <p className="font-semibold">5,000 Bonus Points</p>
                  <p className="text-sm text-muted-foreground">
                    Instant reward on connection
                  </p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="text-xl">🏆</div>
                <div>
                  <p className="font-semibold">Exclusive Badges</p>
                  <p className="text-sm text-muted-foreground">
                    Unlock wallet-only achievements
                  </p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="text-xl">✅</div>
                <div>
                  <p className="font-semibold">Whale Tasks</p>
                  <p className="text-sm text-muted-foreground">
                    Access high-reward tasks for TON holders
                  </p>
                </div>
              </li>
              
              <li className="flex items-start gap-3">
                <div className="text-xl">🪂</div>
                <div>
                  <p className="font-semibold">Higher Airdrop Allocation</p>
                  <p className="text-sm text-muted-foreground">
                    Increased token allocation when we launch
                  </p>
                </div>
              </li>
            </ul>
          </Card>
          
          {/* Connect Button */}
          <Card className="p-6">
            <div className="text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Connect Your TON Wallet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Supported wallets: Tonkeeper, MyTonWallet, OpenMask
              </p>
              
              <div className="flex flex-col items-center gap-4">
                <TonConnectButton />
                
                {walletAddress && !user?.wallet_address && (
                  <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    size="lg"
                    className="w-full"
                  >
                    {isConnecting ? 'Connecting...' : 'Confirm Connection'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
          
          {/* Security Note */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Safe & Non-custodial:</strong> We never have access to your funds. 
              Connection is only used for verification.
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <>
          {/* Connected Wallet */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Connected Wallet</h3>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            
            <div className="bg-muted rounded-lg p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <p className="font-mono text-sm break-all">
                {user.wallet_address}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`https://tonviewer.com/${user.wallet_address}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Explorer
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </Card>
          
          {/* Wallet Tasks */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Wallet Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Complete wallet-related tasks in the Tasks tab to earn more points!
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
