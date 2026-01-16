import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  emoji?: string;
}

interface ParticleFieldProps {
  count?: number;
  type?: 'fire' | 'sparkle' | 'coins' | 'stars';
  className?: string;
  active?: boolean;
}

const PARTICLE_CONFIGS = {
  fire: {
    emojis: ['🔥', '🧡', '💛'],
  },
  sparkle: {
    emojis: ['✨', '⭐', '💫'],
  },
  coins: {
    emojis: ['💰', '🪙', '💎'],
  },
  stars: {
    emojis: ['⭐', '🌟', '✨'],
  },
};

export const ParticleField = memo(function ParticleField({ 
  count = 6, 
  type = 'sparkle', 
  className, 
  active = true 
}: ParticleFieldProps) {
  const config = PARTICLE_CONFIGS[type];

  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 0.3,
      emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
    })),
    [count, config.emojis]
  );

  if (!active) return null;

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: `${particle.size}rem`,
          }}
        >
          {particle.emoji}
        </span>
      ))}
    </div>
  );
});

// Simplified coin rain - only shown briefly
export const CoinRain = memo(function CoinRain({ 
  active = true 
}: { 
  active?: boolean; 
  intensity?: 'low' | 'medium' | 'high' 
}) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50 animate-fade-in">
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-2xl animate-bounce"
          style={{
            left: `${10 + i * 10}%`,
            top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 100}ms`,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
});

// Static fire display - no animations
export const FireTrailStatic = memo(function FireTrailStatic({ active = true }: { active?: boolean }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-lg opacity-70"
          style={{
            left: `${15 + i * 15}%`,
            bottom: '10%',
          }}
        >
          🔥
        </span>
      ))}
    </div>
  );
});
