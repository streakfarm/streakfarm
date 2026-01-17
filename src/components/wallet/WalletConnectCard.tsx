import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    // Check if TonConnectUI is properly initialized
    console.log('🔍 TonConnectUI initialized:', !!tonConnectUI);
    console.log('🔍 Wallet status:', wallet ? 'Connected' : 'Disconnected');
    console.log('🔍 Address:', userFriendlyAddress || 'None');
  }, [tonConnectUI, wallet, userFriendlyAddress]);

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
      
      // Direct modal open - no await needed
      tonConnectUI.openModal();
      
      console.log('✅ Modal opened');
      
      // Keep connecting state for 3 seconds
      setTimeout(() => {
        if (!wallet) {
          setIsConnecting(false);
          console.log('⏱️ Connection timeout - user may have cancelled');
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

  // Stop connecting state when wallet connects
  useEffect(() => {
    if (wallet) {
      setIsConnecting(false);
      console.log('✅ Wallet connected:', wallet.name);
      toast.success(`Connected to ${wallet.name}`);
    }
  }, [wallet]);

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
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Wallet</p>
              <p className="font-medium">{wallet?.name || 'Unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-mono text-sm">{formatAddress(userFriendlyAddress)}</p>
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

      {/* Debug panel - shows connection status */}
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          🔍 Debug Info (tap to expand)
        </summary>
        <div className="mt-2 p-2 bg-muted/20 rounded space-y-1 font-mono">
          <p>• TonConnectUI: {tonConnectUI ? '✅ Ready' : '❌ Not initialized'}</p>
          <p>• Wallet: {wallet?.name || '❌ None'}</p>
          <p>• Address: {userFriendlyAddress ? '✅ Connected' : '❌ None'}</p>
          <p>• Connecting: {isConnecting ? '⏳ Yes' : '✅ No'}</p>
          <p>• Error: {error || '✅ None'}</p>
        </div>
      </details>
    </Card>
  );
}
