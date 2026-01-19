import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@/hooks/useBoxes';
import { cn } from '@/lib/utils';
import { Sparkles, Star, Zap, Gift } from 'lucide-react';
import { celebrateBoxOpen } from '@/components/animations/ConfettiExplosion';
import { CoinRain } from '@/components/animations/ParticleField';

interface BoxOpenAnimationProps {
  box: Box;
  points: number;
  multiplier: number;
  onComplete: () => void;
}

const RARITY_CONFIG = {
  common: {
    bg: 'from-gray-500/30 via-gray-600/20 to-background',
    glow: 'shadow-gray-500/30',
    text: 'text-gray-400',
    particles: 8,
    emoji: '📦',
    label: 'Common',
  },
  rare: {
    bg: 'from-violet-500/40 via-purple-500/20 to-background',
    glow: 'shadow-violet-500/50',
    text: 'text-violet-400',
    particles: 15,
    emoji: '💎',
    label: 'Rare',
  },
  legendary: {
    bg: 'from-amber-400/50 via-orange-500/30 to-background',
    glow: 'shadow-amber-400/60',
    text: 'text-amber-400',
    particles: 25,
    emoji: '👑',
    label: 'Legendary',
  },
};

export function BoxOpenAnimation({ box, points, multiplier, onComplete }: BoxOpenAnimationProps) {
  const [stage, setStage] = useState<'shake' | 'opening' | 'reveal' | 'complete'>('shake');
  const [showCoins, setShowCoins] = useState(false);
  const config = RARITY_CONFIG[box.rarity];

  useEffect(() => {
    // Trigger confetti on reveal
    if (stage === 'reveal') {
      celebrateBoxOpen(box.rarity);
      setShowCoins(true);
    }
  }, [stage, box.rarity]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage('opening'), 600),
      setTimeout(() => setStage('reveal'), 1200),
      setTimeout(() => setStage('complete'), 2500),
      setTimeout(() => {
        setShowCoins(false);
        onComplete();
      }, 4000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-background/95 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Radial glow */}
      <motion.div
        className={cn(
          'absolute inset-0 bg-gradient-radial',
          config.bg
        )}
        animate={{
          opacity: stage === 'reveal' || stage === 'complete' ? 1 : 0.5,
          scale: stage === 'reveal' ? 1.2 : 1,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Coin rain for legendary */}
      <CoinRain 
        active={showCoins && box.rarity === 'legendary'} 
        intensity="high" 
      />

      {/* Particles */}
      <AnimatePresence>
        {(stage === 'reveal' || stage === 'complete') && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: config.particles }).map((_, i) => (
              <motion.div
                key={i}
                className={cn('absolute w-3 h-3', config.text)}
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 80}%`,
                  y: `${50 + (Math.random() - 0.5) * 80}%`,
                  scale: [0, 1.5, 1],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.3,
                  ease: 'easeOut',
                }}
              >
                {i % 3 === 0 ? <Star className="w-full h-full" /> : 
                 i % 3 === 1 ? <Sparkles className="w-full h-full" /> : 
                 <Zap className="w-full h-full" />}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-6 p-8">
        {/* Box/Reward icon */}
        <motion.div
          className="text-8xl"
          animate={
            stage === 'shake' ? {
              x: [-10, 10, -10, 10, -5, 5, 0],
              rotate: [-5, 5, -5, 5, -2, 2, 0],
            } : stage === 'opening' ? {
              scale: [1, 1.3, 0.8],
              rotate: [0, -10, 10],
              opacity: [1, 1, 0],
            } : {}
          }
          transition={{
            duration: stage === 'shake' ? 0.5 : 0.4,
            ease: 'easeInOut',
          }}
        >
          {stage === 'shake' || stage === 'opening' ? '📦' : config.emoji}
        </motion.div>

        {/* Reveal content */}
        <AnimatePresence>
          {(stage === 'reveal' || stage === 'complete') && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Points */}
              <motion.div
                className={cn('text-6xl font-bold mb-2', config.text)}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                +{points.toLocaleString()}
              </motion.div>
              
              <motion.p
                className="text-xl text-muted-foreground mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                POINTS
              </motion.p>

              {/* Multiplier */}
              {multiplier > 1 && (
                <motion.div
                  className="flex items-center justify-center gap-2 text-primary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {multiplier.toFixed(1)}× multiplier applied!
                  </span>
                </motion.div>
              )}

              {/* Rarity badge */}
              <motion.div
                className={cn(
                  'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  'bg-white/10 backdrop-blur-sm border border-white/20'
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <span className="text-lg">{config.emoji}</span>
                <span className={cn('font-bold uppercase tracking-wider', config.text)}>
                  {config.label} Box
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap to continue */}
        {stage === 'complete' && (
          <motion.button
            className="mt-4 text-sm text-muted-foreground"
            onClick={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.5, 1] }}
            transition={{ delay: 0.8, duration: 1.5, repeat: Infinity }}
          >
            Tap anywhere to continue
          </motion.button>
        )}
      </div>

      {/* Click to dismiss */}
      {stage === 'complete' && (
        <button
          className="absolute inset-0 z-10"
          onClick={onComplete}
          aria-label="Continue"
        />
      )}
    </motion.div>
  );
}
