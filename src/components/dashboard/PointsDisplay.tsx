import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useBadges } from '@/hooks/useBadges';
import { cn } from '@/lib/utils';
import { AnimatedCounter, MultiplierBadge } from '@/components/animations/AnimatedCounter';
import { ParticleField } from '@/components/animations/ParticleField';

export function PointsDisplay() {
  const { profile, leaderboardEntry, totalMultiplier } = useProfile();
  const { badgeCount } = useBadges();

  const points = profile?.raw_points || 0;
  const rank = leaderboardEntry?.rank_all_time;
  const nextRank = rank ? rank - 1 : null;

  const formatPoints = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-border p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Sparkle particles for high points */}
      {points >= 10000 && <ParticleField type="stars" count={6} />}
      
      <div className="relative space-y-4">
        {/* Badge showcase */}
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🏆
            </motion.span>
            <span className="text-sm font-medium text-muted-foreground">
              {badgeCount} Badges Owned
            </span>
          </motion.div>
          <MultiplierBadge value={totalMultiplier} />
        </div>

        {/* Points */}
        <div className="text-center py-4">
          <motion.div
            className="flex items-center justify-center gap-2 mb-1"
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="text-3xl"
              animate={{ 
                rotate: [0, -5, 5, 0],
                y: [0, -2, 0],
              }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            >
              💰
            </motion.span>
            <span className="text-4xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              <AnimatedCounter value={points} formatFn={formatPoints} />
            </span>
          </motion.div>
          <p className="text-sm text-muted-foreground">POINTS</p>
        </div>

        {/* Rank */}
        {rank && (
          <motion.div
            className="flex items-center justify-center gap-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Rank:</span>
              <motion.span
                className="font-bold text-foreground"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
              >
                #{rank.toLocaleString()}
              </motion.span>
            </div>
            {nextRank && nextRank > 0 && (
              <>
                <span className="text-muted-foreground">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Next:</span>
                  <span className="font-medium text-primary">#{nextRank.toLocaleString()}</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
