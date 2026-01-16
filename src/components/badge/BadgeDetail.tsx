import { Badge } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';
import { X, Calendar, Users, Sparkles, Wallet, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgeDetailProps {
  badge: Badge;
  isOwned: boolean;
  earnedAt?: string;
  onClose: () => void;
  isWalletConnected?: boolean;
  onConnectWallet?: () => void;
}

const RARITY_STYLES = {
  common: 'from-rarity-common/30 to-transparent border-rarity-common/50',
  rare: 'from-rarity-rare/30 to-transparent border-rarity-rare/50',
  epic: 'from-rarity-epic/30 to-transparent border-rarity-epic/50',
  legendary: 'from-rarity-legendary/30 to-transparent border-rarity-legendary/50',
  mythic: 'from-rarity-mythic/30 to-transparent border-rarity-mythic/50',
};

const CATEGORY_LABELS = {
  streak: '🔥 Streak Badge',
  achievement: '🏆 Achievement Badge',
  wallet: '👛 Wallet Badge',
  special: '⭐ Special Badge',
};

export function BadgeDetail({ 
  badge, 
  isOwned, 
  earnedAt, 
  onClose,
  isWalletConnected = true,
  onConnectWallet
}: BadgeDetailProps) {
  const isWalletBadge = badge.badge_category === 'wallet';
  const isWalletLocked = isWalletBadge && !isWalletConnected && !isOwned;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'w-full max-w-lg bg-card rounded-t-3xl border-t-2 p-6',
            isOwned ? RARITY_STYLES[badge.rarity].split(' ')[2] : 'border-border'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-4xl',
                  isOwned ? `bg-gradient-to-br ${RARITY_STYLES[badge.rarity].split(' ').slice(0, 2).join(' ')}` : 'bg-muted',
                  isWalletLocked && 'grayscale opacity-50'
                )}
              >
                {badge.icon_emoji}
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">{badge.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[badge.badge_category]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Lock Banner */}
          {isWalletLocked && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Wallet Required</h4>
                  <p className="text-xs text-muted-foreground">
                    Connect your TON wallet to unlock this badge
                  </p>
                </div>
              </div>
              {onConnectWallet && (
                <Button 
                  onClick={onConnectWallet}
                  className="w-full mt-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  size="sm"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </motion.div>
          )}

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            {badge.description || 'A special badge for dedicated users.'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center p-3 rounded-xl bg-muted/50"
            >
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-primary" />
              <span className="text-lg font-bold text-primary">{badge.multiplier.toFixed(1)}×</span>
              <p className="text-[10px] text-muted-foreground uppercase">Multiplier</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-3 rounded-xl bg-muted/50"
            >
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <span className="text-lg font-bold">{badge.current_supply}</span>
              <p className="text-[10px] text-muted-foreground uppercase">Owned</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-3 rounded-xl bg-muted/50"
            >
              <span className={cn(
                'text-lg font-bold uppercase',
                `text-rarity-${badge.rarity}`
              )}>
                {badge.rarity}
              </span>
              <p className="text-[10px] text-muted-foreground uppercase">Rarity</p>
            </motion.div>
          </div>

          {/* Earned info or requirements */}
          {isOwned ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20"
            >
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-primary">Badge Earned!</p>
                {earnedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-medium mb-2">How to earn:</p>
              <p className="text-sm text-muted-foreground">
                {badge.badge_category === 'streak' && 'Maintain your daily check-in streak!'}
                {badge.badge_category === 'achievement' && 'Complete specific achievements in the game.'}
                {badge.badge_category === 'wallet' && (
                  isWalletConnected 
                    ? 'Meet the wallet requirements (balance, NFT holdings, etc.)' 
                    : 'Connect your TON wallet first, then meet the requirements.'
                )}
                {badge.badge_category === 'special' && 'Limited edition badge - check for special events!'}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
