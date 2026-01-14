'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Gift, Trophy, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const onboardingSteps = [
  {
    icon: Flame,
    title: 'Build Daily Streaks',
    description: 'Check in every day to build your streak. Miss a day and lose it all!',
    color: 'from-orange-500 to-red-600',
  },
  {
    icon: Gift,
    title: 'Open Mystery Boxes',
    description: 'Open hourly boxes to earn points. The longer your streak, the better the rewards!',
    color: 'from-blue-500 to-purple-600',
  },
  {
    icon: Trophy,
    title: 'Unlock Badges',
    description: 'Complete challenges to unlock badges that give permanent multipliers.',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    icon: Users,
    title: 'Invite Friends',
    description: 'Share your referral link and earn bonus points for every friend who joins!',
    color: 'from-green-500 to-teal-600',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <motion.div
            key={currentStep}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${step.color}`}
          >
            <Icon className="h-14 w-14 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold">{step.title}</CardTitle>
          <CardDescription className="text-base">
            {step.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {currentStep === onboardingSteps.length - 1 ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
