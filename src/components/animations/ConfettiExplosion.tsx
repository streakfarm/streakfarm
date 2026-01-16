import { useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiExplosionProps {
  trigger: boolean;
  onComplete?: () => void;
  type?: 'celebration' | 'reward' | 'streak' | 'legendary';
}

const CONFETTI_COLORS = {
  celebration: ['#FF6B35', '#8B5CF6', '#FFD700', '#00D4FF', '#FF69B4'],
  reward: ['#FFD700', '#FFA500', '#FF8C00', '#FFEC8B'],
  streak: ['#FF6B35', '#FF8C00', '#FFA500', '#FFD700', '#FF4500'],
  legendary: ['#FFD700', '#FFA500', '#8B5CF6', '#FF69B4', '#00D4FF', '#FFFFFF'],
};

export function ConfettiExplosion({ trigger, onComplete, type = 'celebration' }: ConfettiExplosionProps) {
  const fireConfetti = useCallback(() => {
    const colors = CONFETTI_COLORS[type];
    const duration = type === 'legendary' ? 4000 : 2000;
    const end = Date.now() + duration;

    const frame = () => {
      if (Date.now() > end) {
        onComplete?.();
        return;
      }

      confetti({
        particleCount: type === 'legendary' ? 5 : 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        shapes: ['circle', 'square'],
        gravity: 1.2,
        scalar: 1.1,
        drift: 0.5,
      });

      confetti({
        particleCount: type === 'legendary' ? 5 : 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        shapes: ['circle', 'square'],
        gravity: 1.2,
        scalar: 1.1,
        drift: -0.5,
      });

      requestAnimationFrame(frame);
    };

    // Initial burst
    confetti({
      particleCount: type === 'legendary' ? 150 : 80,
      spread: 100,
      origin: { y: 0.6 },
      colors,
      shapes: ['circle', 'square'],
      gravity: 0.8,
      scalar: 1.2,
    });

    frame();
  }, [type, onComplete]);

  useEffect(() => {
    if (trigger) {
      fireConfetti();
    }
  }, [trigger, fireConfetti]);

  return null;
}

// Specific confetti bursts
export function celebrateCheckin() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.5 },
    colors: ['#FF6B35', '#FF8C00', '#FFD700'],
  });
}

export function celebrateTaskComplete() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#10B981', '#34D399', '#6EE7B7'],
    shapes: ['circle'],
  });
}

export function celebrateBoxOpen(rarity: 'common' | 'rare' | 'legendary') {
  const config = {
    common: { count: 30, colors: ['#6B7280', '#9CA3AF', '#D1D5DB'] },
    rare: { count: 60, colors: ['#8B5CF6', '#A78BFA', '#C4B5FD'] },
    legendary: { count: 150, colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6B35', '#FFFFFF'] },
  };

  const { count, colors } = config[rarity];

  // Center burst
  confetti({
    particleCount: count,
    spread: 100,
    origin: { y: 0.5 },
    colors,
    shapes: ['circle', 'square'],
    gravity: 0.8,
    scalar: rarity === 'legendary' ? 1.5 : 1.2,
  });

  if (rarity === 'legendary') {
    // Extra bursts for legendary
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors,
      });
    }, 200);
  }
}

export function celebrateMilestone() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 7,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#FFD700', '#FF6B35', '#8B5CF6', '#00D4FF'],
    });
    confetti({
      particleCount: 7,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#FFD700', '#FF6B35', '#8B5CF6', '#00D4FF'],
    });

    requestAnimationFrame(frame);
  };

  frame();
}
