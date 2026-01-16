import { Badge } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';
import { Lock, Check, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

interface BadgeCardProps {
  badge: Badge;
  isOwned: boolean;
  earnedAt?: string;
  onClick?: () => void;
  isWalletConnected?: boolean;
}

const RARITY_STYLES = {
  common: {
    bg: 'bg-gradient-to-br from-rarity-common/20 to-rarity-common/5',
    border: 'border-rarity-common/50',
    text: 'text-rarity-common',
  },
  rare: {
    bg: 'bg-gradient-to-br from-rarity-rare/20 to-rarity-rare/5',
    border: 'border-rarity-rare/50',
    text: 'text-rarity-rare',
  },
  epic: {
    bg: 'bg-gradient-to-br from-rarity-epic/20 to-rarity-epic/5',
    border: 'border-rarity-epic/50',
    text: 'text-rarity-epic',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-rarity-legendary/20 to-rarity-legendary/5',
    border: 'border-rarity-legendary/50',
    text: 'text-rarity-legendary',
  },
  mythic: {
    bg: 'bg-gradient-to-br from-rarity-mythic/20 to-rarity-mythic/5',
    border: 'border-rarity-mythic/50',
    text: 'text-rarity-mythic',
  },
};

export function BadgeCard({ badge, isOwned, earnedAt, onClick, isWalletConnected = true }: BadgeCardProps) {
  const styles = RARITY_STYLES[badge.rarity];
  const isWalletBadge = badge.badge_category === 'wallet';
  const isWalletLocked = isWalletBadge && !isWalletConnected && !isOwned;

  return (
    <motion.button
      onClick={onClick}
      whileHover={!isWalletLocked ? { scale: 1.05 } : {}}
      whileTap={!isWalletLocked ? { scale: 0.98 } : {}}
      className={cn(
        'relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300',
        isOwned ? styles.bg : 'bg-muted/30',
        isOwned ? styles.border : 'border-muted/50',
        isOwned && 'hover:shadow-lg',
        !isOwned && !isWalletLocked && 'opacity-60',
        isWalletLocked && 'opacity-40',
        badge.rarity === 'mythic' && isOwned && 'mythic-glow'
      )}
    >
      {/* Wallet lock overlay for wallet badges */}
      {isWalletLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-2xl backdrop-blur-sm z-10">
          <Wallet className="w-6 h-6 text-muted-foreground mb-1" />
          <span className="text-[10px] text-muted-foreground font-medium">Connect Wallet</span>
        </div>
      )}

      {/* Owned indicator */}
      {isOwned && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}

      {/* Lock for unowned (non-wallet or wallet-connected) */}
      {!isOwned && !isWalletLocked && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-muted rounded-full flex items-center justify-center">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </div>
      )}

      {/* Badge icon */}
      <div className={cn(
        'text-4xl mb-2 transition-transform',
        isOwned && 'hover:scale-110',
        (!isOwned || isWalletLocked) && 'grayscale'
      )}>
        {badge.icon_emoji}
      </div>

      {/* Badge name */}
      <h3 className={cn(
        'text-sm font-semibold text-center mb-1',
        isOwned ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {badge.name}
      </h3>

      {/* Multiplier */}
      <span className={cn(
        'text-xs font-bold px-2 py-0.5 rounded-full',
        isOwned ? styles.bg : 'bg-muted',
        isOwned ? styles.text : 'text-muted-foreground'
      )}>
        {badge.multiplier.toFixed(1)}×
      </span>

      {/* Rarity label */}
      <span className={cn(
        'text-[10px] uppercase tracking-wider mt-2',
        isOwned ? styles.text : 'text-muted-foreground'
      )}>
        {badge.rarity}
      </span>

      {/* Supply info */}
      {badge.max_supply && (
        <span className="text-[10px] text-muted-foreground mt-1">
          {badge.current_supply}/{badge.max_supply}
        </span>
      )}

      {/* Wallet badge indicator */}
      {isWalletBadge && !isWalletLocked && (
        <div className="absolute bottom-2 left-2">
          <Wallet className="w-3 h-3 text-muted-foreground" />
        </div>
      )}
    </motion.button>
  );
}
