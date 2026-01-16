import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Check, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useTonWalletContext } from '@/hooks/useTonWallet';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface WalletConnectCardProps {
  className?: string;
  compact?: boolean;
}

export function WalletConnectCard({ className, compact = false }: WalletConnectCardProps) {
  const { isConnected, walletAddress, connect, disconnect, isConnecting } = useTonWalletContext();
  const { hapticFeedback } = useTelegram();
  const [showFullAddress, setShowFullAddress] = useState(false);

  const handleConnect = async () => {
    hapticFeedback('medium');
    await connect();
  };

  const handleDisconnect = async () => {
    hapticFeedback('light');
    await disconnect();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (compact) {
    return (
      <motion.button
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-full',
          'bg-wallet/20 border border-wallet/30 text-wallet',
          'hover:bg-wallet/30 transition-colors',
          className
        )}
        onClick={isConnected ? handleDisconnect : handleConnect}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isConnected ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">
              {walletAddress ? shortenAddress(walletAddress) : 'Connected'}
            </span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">Connect</span>
          </>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5',
        isConnected 
          ? 'bg-gradient-to-br from-wallet/10 to-card border-wallet/30'
          : 'bg-gradient-to-br from-secondary/10 via-card to-primary/5 border-secondary/30',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background animation */}
      {!isConnected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isConnected ? 'bg-wallet/20' : 'bg-secondary/20'
              )}
              animate={!isConnected ? {
                boxShadow: [
                  '0 0 20px hsl(185 80% 50% / 0.3)',
                  '0 0 40px hsl(185 80% 50% / 0.5)',
                  '0 0 20px hsl(185 80% 50% / 0.3)',
                ],
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wallet className={cn(
                'w-6 h-6',
                isConnected ? 'text-wallet' : 'text-secondary'
              )} />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? 'Unlock wallet badges & rewards'
                  : 'Connect TON wallet to earn more'}
              </p>
            </div>
          </div>

          {isConnected && (
            <motion.div
              className="flex items-center gap-1 text-wallet"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div 
                className="bg-background/50 rounded-lg p-3 cursor-pointer"
                onClick={() => setShowFullAddress(!showFullAddress)}
              >
                <div className="text-xs text-muted-foreground mb-1">Wallet Address</div>
                <div className="font-mono text-sm text-wallet break-all">
                  {showFullAddress ? walletAddress : (walletAddress ? shortenAddress(walletAddress) : '—')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rarity-legendary" />
                <span className="text-sm text-muted-foreground">
                  Wallet badges unlocked!
                </span>
              </div>

              <motion.button
                className="w-full py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleDisconnect}
                whileTap={{ scale: 0.98 }}
              >
                Disconnect Wallet
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="connect"
              className={cn(
                'w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2',
                'bg-gradient-to-r from-secondary to-wallet text-secondary-foreground',
                'hover:opacity-90 transition-opacity',
                'disabled:opacity-50'
              )}
              onClick={handleConnect}
              disabled={isConnecting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect TON Wallet
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
