'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTelegram } from '@/lib/hooks/useTelegram';
import welcomeAnimation from '@/public/lottie/welcome.json';

const slides = [
  {
    title: 'Welcome to StreakFarm! 🌾',
    description: 'Build streaks, earn points, and climb the leaderboard',
    emoji: '👋',
  },
  {
    title: 'Open Boxes Every Hour 📦',
    description: 'Get 24 boxes daily. Open them before they expire!',
    emoji: '📦',
  },
  {
    title: 'Build Your Streak 🔥',
    description: 'Daily check-ins increase your point multiplier',
    emoji: '🔥',
  },
  {
    title: 'Earn Badges 🏆',
    description: 'Complete achievements to unlock permanent multipliers',
    emoji: '🏆',
  },
  {
    title: 'Invite Friends 👥',
    description: 'Get 10% of their lifetime points forever',
    emoji: '👥',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { haptic } = useTelegram();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const handleNext = () => {
    haptic?.impactOccurred('light');
    
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.replace('/dashboard');
    }
  };
  
  const handleSkip = () => {
    haptic?.impactOccurred('light');
    router.replace('/dashboard');
  };
  
  const slide = slides[currentSlide];
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className="text-8xl mb-6">{slide.emoji}</div>
            
            <h1 className="text-2xl font-bold mb-4">{slide.title}</h1>
            <p className="text-muted-foreground mb-8">{slide.description}</p>
            
            <div className="flex gap-2 mb-6">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-3">
              {currentSlide > 0 && (
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Skip
                </Button>
              )}
              <Button onClick={handleNext} className="flex-1">
                {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
