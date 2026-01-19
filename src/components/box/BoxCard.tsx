import { useState, useEffect } from 'react';
import { Box } from '@/hooks/useBoxes';
import { Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BoxCardProps {
  box: Box;
  onOpen: () => void;
  isOpening?: boolean;
}

const RARITY_CONFIG = {
  common: {
    bg: 'bg-gradient-to-br from-rarity-common/20 to-rarity-common/5',
    border: 'border-rarity-common/50',
    text: 'text-rarity-common',
    glow: 'hover:shadow-rarity-common/20',
    label: 'Common',
    emoji: '📦',
  },
  rare: {
    bg: 'bg-gradient-to-br from-rarity-rare/20 to-rarity-rare/5',
    border: 'border-rarity-rare/50',
    text: 'text-rarity-rare',
    glow: 'hover:shadow-rarity-rare/30',
    label: 'Rare',
    emoji: '💎',
  },
  legendary: {
    bg: 'bg-gradient-to-br from-rarity-legendary/20 to-rarity-legendary/5',
    border: 'border-rarity-legendary/50',
    text: 'text-rarity-legendary',
    glow: 'hover:shadow-rarity-legendary/30',
    label: 'Legendary',
    emoji: '👑',
  },
};

export function BoxCard({ box, onOpen, isOpening }: BoxCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const config = RARITY_CONFIG[box.rarity];

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(box.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [box.expires_at]);

  const isUrgent = timeLeft.includes(':') && !timeLeft.includes('h');

  return (
    <button
      onClick={onOpen}
      disabled={isOpening || timeLeft === 'Expired'}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300',
        config.bg,
        config.border,
        'hover:scale-[1.02] hover:shadow-xl',
        config.glow,
        isOpening && 'animate-pulse pointer-events-none',
        timeLeft === 'Expired' && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Shimmer effect for rare/legendary */}
      {box.rarity !== 'common' && (
        <div className="absolute inset-0 box-shimmer pointer-events-none" />
      )}

      {/* Sparkles for legendary */}
      {box.rarity === 'legendary' && (
        <Sparkles className="absolute top-3 right-3 w-5 h-5 text-rarity-legendary animate-pulse" />
      )}

      <div className="relative flex flex-col items-center gap-3">
        {/* Box emoji */}
        <div className={cn(
          'text-5xl transition-transform',
          isOpening && 'animate-bounce'
        )}>
          {config.emoji}
        </div>

        {/* Rarity label */}
        <span className={cn('text-sm font-bold uppercase tracking-wider', config.text)}>
          {config.label}
        </span>

        {/* Points range */}
        <p className="text-xs text-muted-foreground">
          {box.rarity === 'common' && '50 - 1,000 pts'}
          {box.rarity === 'rare' && '5,000 - 10,000 pts'}
          {box.rarity === 'legendary' && '10,000 - 50,000 pts'}
        </p>

        {/* Expiry timer */}
        <div className={cn(
          'flex items-center gap-1.5 text-xs',
          isUrgent ? 'text-destructive' : 'text-muted-foreground'
        )}>
          <Clock className="w-3.5 h-3.5" />
          <span className={isUrgent ? 'font-bold' : ''}>{timeLeft}</span>
        </div>
      </div>
    </button>
  );
}
