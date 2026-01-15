'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2 } from 'lucide-react';

export function AchievementTimeline() {
  const achievements = [
    { title: 'Joined StreakFarm', date: 'Jan 15, 2026', completed: true },
    { title: 'First Check-in', date: 'Jan 15, 2026', completed: true },
    { title: 'Opened First Box', date: 'Jan 15, 2026', completed: true },
    { title: '7-Day Streak', date: 'Pending', completed: false },
    { title: 'First Referral', date: 'Pending', completed: false },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Achievement Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.map((achievement, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  achievement.completed
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              >
                <CheckCircle2
                  className={`h-4 w-4 ${
                    achievement.completed ? 'text-white' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${!achievement.completed && 'text-muted-foreground'}`}>
                  {achievement.title}
                </p>
                <p className="text-sm text-muted-foreground">{achievement.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
