import { motion } from 'framer-motion';
import { useTelegram } from '@/hooks/useTelegram';

interface SplashScreenProps {
  showTelegramPrompt?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function SplashScreen({ showTelegramPrompt = false, error, onRetry }: SplashScreenProps) {
  const { isTelegram, initData } = useTelegram();

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
        <motion.div
          className="flex flex-col items-center gap-6 text-center max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center border border-destructive/30"
          >
            <span className="text-4xl">⚠️</span>
          </motion.div>

          <div>
            <h1 className="text-xl font-bold mb-2 text-destructive">Authentication Error</h1>
            <p className="text-muted-foreground text-sm">
              {error}
            </p>
          </div>

          {/* Debug info for developers */}
          {isTelegram && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg w-full">
              <div>Telegram: Connected</div>
              <div>InitData: {initData ? `${initData.length} chars` : 'Missing'}</div>
            </div>
          )}

          {onRetry && (
            <motion.button
              onClick={onRetry}
              className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Try Again
            </motion.button>
          )}

          {!isTelegram && (
            <motion.a
              href="https://t.me/StreakFarmBot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">📱</span>
              Open in Telegram
            </motion.a>
          )}
        </motion.div>
      </div>
    );
  }

  if (showTelegramPrompt) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
        <motion.div
          className="flex flex-col items-center gap-6 text-center max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 30px rgba(255,107,53,0.3)',
                '0 0 60px rgba(255,107,53,0.5)',
                '0 0 30px rgba(255,107,53,0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-5xl">🔥</span>
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold mb-2">StreakFarm</h1>
            <p className="text-muted-foreground text-sm">
              Open in Telegram to start earning rewards
            </p>
          </div>

          <div className="space-y-3 w-full">
            <motion.a
              href="https://t.me/StreakFarmBot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xl">📱</span>
              Open @StreakFarmBot
            </motion.a>

            <p className="text-xs text-muted-foreground">
              This app works best inside Telegram
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Animated splash screen during loading
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Animated logo */}
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 30px rgba(255,107,53,0.3)',
                '0 0 60px rgba(255,107,53,0.5)',
                '0 0 30px rgba(255,107,53,0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="text-5xl"
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🔥
            </motion.span>
          </motion.div>

          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              style={{
                left: '50%',
                bottom: '100%',
              }}
              animate={{
                y: [-20, -50],
                x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
                opacity: [0.8, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreakFarm
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Loading...</p>
        </motion.div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
