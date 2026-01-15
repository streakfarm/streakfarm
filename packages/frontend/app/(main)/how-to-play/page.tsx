'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Gift, Trophy, Users, Zap, Star } from 'lucide-react';

const guides = [
  {
    icon: Flame,
    title: 'Daily Streaks',
    description: 'Check in every 24 hours to maintain your streak. Missing a day resets it to zero!',
    tips: [
      'Check in once per day',
      'Longer streaks = bigger rewards',
      'Set a reminder to never miss',
    ],
  },
  {
    icon: Gift,
    title: 'Mystery Boxes',
    description: 'Open boxes every hour to earn random point rewards.',
    tips: [
      'Available every hour',
      'Rewards range from 100-10,000 points',
      'Your multipliers apply to box rewards',
    ],
  },
  {
    icon: Trophy,
    title: 'Badges & Multipliers',
    description: 'Unlock badges by completing challenges. Each badge gives a permanent multiplier boost.',
    tips: [
      'Check badge requirements',
      'Multipliers stack up',
      'Some badges are limited edition',
    ],
  },
  {
    icon: Users,
    title: 'Referral System',
    description: 'Invite friends and earn bonus points for each successful referral.',
    tips: [
      'Share your unique link',
      'Higher tiers = more rewards',
      'Active referrals count more',
    ],
  },
  {
    icon: Zap,
    title: 'Tasks & Challenges',
    description: 'Complete social tasks and challenges to earn extra points.',
    tips: [
      'New tasks added weekly',
      'Some tasks are repeatable',
      'Verification required for some',
    ],
  },
  {
    icon: Star,
    title: 'Early Adopter Perks',
    description: 'First 10,000 users get permanent 2× multiplier and exclusive badges.',
    tips: [
      'Limited to first 10K users',
      'Founding Member badge',
      'Permanent multiplier boost',
    ],
  },
];

export default function HowToPlayPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How to Play 📚</h1>
        <p className="text-muted-foreground">
          Learn how to maximize your rewards
        </p>
      </div>

      {guides.map((guide, index) => {
        const Icon = guide.icon;
        return (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{guide.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">{guide.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Tips:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
