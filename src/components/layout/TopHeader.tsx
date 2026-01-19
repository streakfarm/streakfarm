import { Link } from 'react-router-dom';
import { Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { useEffect, useState } from 'react';

export function TopHeader() {
  const { profile, totalMultiplier } = useProfile();
  const { hapticFeedback } = useTelegram();
  const [displayPoints, setDisplayPoints] = useState(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  const rawPoints = profile?.raw_points || 0;
  const streak = profile?.streak_current || 0;

  // Animate points tick-up
  useEffect(() => {
    if (rawPoints > displayPoints) {
      const diff = rawPoints - displayPoints;
      const step = Math.max(1, Math.floor(diff / 20));
      const timer = setInterval(() => {
        setDisplayPoints(prev => {
          const next = prev + step;
          if (next >= rawPoints) {
            clearInterval(timer);
            return rawPoints;
          }
          return next;
        });
      }, 50);
      return () => clearInterval(timer);
    } else {
      setDisplayPoints(rawPoints);
    }
  }, [rawPoints]);

  // Animate streak
  useEffect(() => {
    setDisplayStreak(streak);
  }, [streak]);

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
          onClick={() => hapticFeedback('light')}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-2xl"
          >
            🔥
          </motion.div>
          <span className="font-bold text-lg text-gradient-primary">
            StreakFarm
          </span>
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {/* Streak Badge */}
          <Link to="/tasks" onClick={() => hapticFeedback('selection')}>
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
            >
              <Flame className="w-4 h-4 text-orange-500 streak-fire" />
              <motion.span 
                key={displayStreak}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-bold text-sm text-orange-500"
              >
                {displayStreak}
              </motion.span>
            </motion.div>
          </Link>

          {/* Points Badge */}
          <Link to="/leaderboard" onClick={() => hapticFeedback('selection')}>
            <motion.div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <Trophy className="w-4 h-4 text-yellow-500 relative z-10" />
              <motion.span 
                key={displayPoints}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-bold text-sm text-yellow-500 relative z-10"
              >
                {displayPoints.toLocaleString()}
              </motion.span>
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
}
