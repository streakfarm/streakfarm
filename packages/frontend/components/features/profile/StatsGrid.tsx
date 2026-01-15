'use client';

import { User } from '@streakfarm/shared/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Flame, Gift, Users, Zap, Award } from 'lucide-react';
import { formatPoints } from '@/lib/utils/format';

interface StatsGridProps {
  user: User;
}

export function StatsGrid({ user }: StatsGridProps) {
  const stats = [
    {
      icon: Trophy,
      label: 'Total Points',
      value: formatPoints(user.total_points),
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${user.current_streak} days`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Zap,
      label: 'Longest Streak',
      value: `${user.longest_streak} days`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Gift,
      label: 'Boxes Opened',
      value: user.total_boxes_opened.toString(),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Award,
      label: 'Tasks Completed',
      value: user.total_tasks_completed.toString(),
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Users,
      label: 'Referrals',
      value: user.total_referrals.toString(),
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
