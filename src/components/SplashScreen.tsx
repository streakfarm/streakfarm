import { motion } from 'framer-motion';

interface SplashScreenProps {
  showTelegramPrompt?: boolean;
}

export function SplashScreen({ showTelegramPrompt = false }: SplashScreenProps) {
  if (showTelegramPrompt) {
    // Simple "Open in Telegram" message - no login/signup text
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <motion.div 
          className="flex flex-col items-center gap-6 px-8 text-center"
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
              Open in Telegram to continue
            </p>
          </div>

          <motion.a
            href="https://t.me/StreakFarmBot"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">📱</span>
            Open @StreakFarmBot
          </motion.a>
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
            className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center"
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
              className="text-6xl"
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
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              style={{
                left: '50%',
                bottom: '100%',
              }}
              animate={{
                y: [-20, -60],
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            StreakFarm
          </h1>
        </motion.div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-4">
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
