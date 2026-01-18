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

  const isConnected = !!wallet && !!userFriendlyAddress;

  const getWalletName = () => {
    if (!wallet) return 'Unknown';
    
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
      toast.success(`Connected to ${getWalletName()}`);
    }
  }, [wallet]);

  const handleConnect = async () => {
    if (!tonConnectUI) return;

    try {
      setIsConnecting(true);
      tonConnectUI.openModal();
      
      setTimeout(() => {
        if (!wallet) setIsConnecting(false);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      toast.error(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!tonConnectUI) return;

    try {
      await tonConnectUI.disconnect();
      toast.success('Wallet disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (userFriendlyAddress) {
      navigator.clipboard.writeText(userFriendlyAddress);
      toast.success('Address copied');
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

      {isConnected ? (
        <div className="space-y-3">
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
                <span>Access to Premium Rewards</span>
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
        </div>
      )}
    </Card>
  );
}
