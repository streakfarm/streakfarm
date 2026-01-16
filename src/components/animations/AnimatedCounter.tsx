import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatFn?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 0.8,
  className,
  prefix = '',
  suffix = '',
  formatFn,
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    const num = Math.round(current);
    if (formatFn) return formatFn(num);
    return num.toLocaleString();
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={cn('tabular-nums', className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}

// Points counter with formatting
export function PointsCounter({ value, className }: { value: number; className?: string }) {
  const formatPoints = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <AnimatedCounter
      value={value}
      className={cn('font-bold', className)}
      formatFn={formatPoints}
    />
  );
}

// Streak counter with fire animation
export function StreakCounter({ value, className }: { value: number; className?: string }) {
  return (
    <motion.div
      className={cn('flex items-center gap-1', className)}
      animate={value > 0 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
    >
      <motion.span
        className="text-3xl"
        animate={{ 
          rotate: [0, -5, 5, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          duration: 0.5, 
          repeat: Infinity, 
          repeatDelay: 1.5,
        }}
      >
        🔥
      </motion.span>
      <AnimatedCounter value={value} className="text-2xl font-bold" />
    </motion.div>
  );
}

// Multiplier badge with sparkle effect
export function MultiplierBadge({ value, className }: { value: number; className?: string }) {
  return (
    <motion.div
      className={cn(
        'relative inline-flex items-center gap-1 px-3 py-1 rounded-full',
        'bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30',
        className
      )}
      animate={{
        boxShadow: [
          '0 0 10px hsl(270 70% 55% / 0.3)',
          '0 0 20px hsl(270 70% 55% / 0.5)',
          '0 0 10px hsl(270 70% 55% / 0.3)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.span
        className="text-sm"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        ✨
      </motion.span>
      <span className="font-bold text-gradient-secondary">{value.toFixed(1)}×</span>
    </motion.div>
  );
}
