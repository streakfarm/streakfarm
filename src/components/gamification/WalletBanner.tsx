import { motion } from 'framer-motion';
import { Wallet, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { useTonWalletContext } from '@/hooks/useTonWallet';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';

export function WalletBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { isConnected, connect } = useTonWalletContext();
  const { profile } = useProfile();
  const { hapticFeedback } = useTelegram();

  // Don't show if wallet connected or dismissed
  if (isConnected || profile?.wallet_address || dismissed) {
    return null;
  }

  const handleConnect = () => {
    hapticFeedback('medium');
    connect();
  };

  const handleDismiss = () => {
    hapticFeedback('light');
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <button
        onClick={handleConnect}
        className="relative w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm flex items-center gap-2">
              Connect TON Wallet
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                +2K Bonus
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Unlock exclusive rewards & badges
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
}
