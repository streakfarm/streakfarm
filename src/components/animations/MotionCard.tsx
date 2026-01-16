import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glow' | 'legendary' | 'glass';
  hoverScale?: number;
  tapScale?: number;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, children, variant = 'default', hoverScale = 1.02, tapScale = 0.98, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-card border border-border',
      glow: 'bg-card border border-primary/30 card-glow',
      legendary: 'bg-gradient-to-br from-rarity-legendary/10 to-card border border-rarity-legendary/30 badge-legendary',
      glass: 'bg-background/40 backdrop-blur-lg border border-white/10',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl p-4 overflow-hidden relative',
          variantClasses[variant],
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: tapScale }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MotionCard.displayName = 'MotionCard';

// Animated list item
export const MotionListItem = motion(
  forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
    ({ className, children, ...props }, ref) => (
      <motion.div
        ref={ref}
        className={cn('', className)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  )
);

MotionListItem.displayName = 'MotionListItem';

// Staggered container for lists
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Pulsing action button
export function PulseButton({
  children,
  className,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      className={cn(
        'relative px-6 py-3 rounded-xl font-bold',
        'bg-gradient-to-r from-primary to-accent text-primary-foreground',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={!disabled ? {
        boxShadow: [
          '0 0 20px hsl(32 95% 55% / 0.4)',
          '0 0 40px hsl(32 95% 55% / 0.6)',
          '0 0 20px hsl(32 95% 55% / 0.4)',
        ],
      } : {}}
      transition={{
        boxShadow: { duration: 2, repeat: Infinity },
        scale: { type: 'spring', stiffness: 400, damping: 25 },
      }}
    >
      {children}
    </motion.button>
  );
}

// 3D flip card for boxes
export function FlipCard({
  front,
  back,
  isFlipped,
  onClick,
  className,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      className={cn('relative cursor-pointer perspective-1000', className)}
      onClick={onClick}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <motion.div
        className="w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Shake animation for boxes
export function ShakeBox({
  children,
  isShaking,
  className,
}: {
  children: React.ReactNode;
  isShaking: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={isShaking ? {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
        rotate: [0, -5, 5, -5, 5, -2, 2, 0],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
