import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle, CheckCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function WalletConnectCard() {
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();
  const wallet = useTonWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!wallet && !!userFriendlyAddress;

  // Get proper wallet name
  const getWalletName = () => {
    if (!wallet) return 'Unknown';
    
    // Map device names to user-friendly names
    const walletNameMap: Record<string, string> = {
      'tonkeeper': 'Tonkeeper',
      'mytonwallet': 'MyTonWallet',
      'openmask': 'OpenMask',
      'tonhub': 'Tonhub',
      'dewallet': 'DeWallet',
      'xtonwallet': 'XTon Wallet',
      'telegram-wallet': 'Telegram Wallet',
    };

    const deviceName = wallet.device.appName.toLowerCase();
    return walletNameMap[deviceName] || wallet.device.appName || 'TON Wallet';
  };

  useEffect(() => {
    if (wallet) {
      setIsConnecting(false);
      const walletName = getWalletName();
      console.log('✅ Wallet connected:', walletName);
      toast.success(`Connected to ${walletName}`);
    }
  }, [wallet]);

  const handleConnect = async () => {
    console.log('🔘 Connect button clicked');
    
    if (!tonConnectUI) {
      const errorMsg = 'TonConnectUI not initialized';
      console.error('❌', errorMsg);
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('📱 Opening wallet modal...');
      tonConnectUI.openModal();
      console.log('✅ Modal opened');
      
      setTimeout(() => {
        if (!wallet) {
          setIsConnecting(false);
          console.log('⏱️ Connection timeout');
        }
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Connection error:', errorMessage);
      toast.error(`Connection failed: ${errorMessage}`);
      setError(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tonConnectUI) {
      toast.error('TonConnectUI not available');
      return;
    }

    try {
      console.log('🔌 Disconnecting wallet...');
      await tonConnectUI.disconnect();
      toast.success('Wallet disconnected');
      console.log('✅ Disconnected successfully');
    } catch (err) {
      console.error('❌ Disconnect error:', err);
      toast.error('Failed to disconnect wallet');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (userFriendlyAddress) {
      navigator.clipboard.writeText(userFriendlyAddress);
      toast.success('Address copied to clipboard');
    }
  };

  const openExplorer = () => {
    if (userFriendlyAddress) {
      window.open(`https://tonviewer.com/${userFriendlyAddress}`, '_blank');
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          TON Wallet
        </h3>
        
        {isConnected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-green-500 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Connected
          </motion.div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-medium">Connection Error</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="space-y-3">
          {/* Wallet Info Card */}
          <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Wallet</p>
                <p className="font-semibold text-primary">{getWalletName()}</p>
              </div>
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="pt-2 border-t border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm flex-1">{formatAddress(userFriendlyAddress)}</p>
                <button
                  onClick={copyAddress}
                  className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={openExplorer}
                  className="p-1.5 hover:bg-primary/10 rounded transition-colors"
                  title="View on explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Benefits */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Active Benefits:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>+0.1× Multiplier Bonus</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Exclusive Wallet Badge</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Access to Rewards</span>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleDisconnect}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <p className="text-muted-foreground">
              Connect your TON wallet to unlock exclusive badges and increase your multiplier by 0.1×
            </p>
          </div>

          <Button 
            className="w-full"
            onClick={handleConnect}
            disabled={isConnecting || !tonConnectUI}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Opening Wallet...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect TON Wallet
              </>
            )}
          </Button>

          {!tonConnectUI && (
            <p className="text-xs text-red-500 text-center">
              TON Connect not initialized
            </p>
          )}
        </div>
      )}

      {/* Debug panel */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          🔍 Debug Info (tap to expand)
        </summary>
        <div className="mt-2 p-2 bg-muted/20 rounded space-y-1 font-mono">
          <p>• TonConnectUI: {tonConnectUI ? '✅ Ready' : '❌ Not initialized'}</p>
          <p>• Wallet: {wallet ? `✅ ${getWalletName()}` : '❌ None'}</p>
          <p>• Address: {userFriendlyAddress ? '✅ Connected' : '❌ None'}</p>
          <p>• Connecting: {isConnecting ? '⏳ Yes' : '✅ No'}</p>
          <p>• Error: {error || '✅ None'}</p>
        </div>
      </details>
    </Card>
  );
}
