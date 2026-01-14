'use client';

import { BoxOpener } from '@/components/features/box/BoxOpener';
import { StreakDisplay } from '@/components/features/streak/StreakDisplay';
import { DailyCheckin } from '@/components/features/streak/DailyCheckin';
import { Card } from '@/components/ui/card';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useBadgeStore } from '@/lib/stores/useBadgeStore';
import { Trophy, Users, Gift } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUserStore();
  const { userBadges } = useBadgeStore();
  
  return (
    <div className="space-y-6">
      {/* Daily Check-in */}
      <DailyCheckin />
      
      {/* Box Opener */}
      <BoxOpener />
      
      {/* Streak Display */}
      <StreakDisplay />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{userBadges.length}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{user?.total_referrals || 0}</p>
          <p className="text-xs text-muted-foreground">Referrals</p>
        </Card>
        
        <Card className="p-4 text-center">
          <Gift className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{user?.total_boxes_opened || 0}</p>
          <p className="text-xs text-muted-foreground">Boxes</p>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-3">
        <Link href="/tasks">
          <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
            <div>
              <h4 className="font-semibold">Complete Tasks</h4>
              <p className="text-sm text-muted-foreground">
                Earn more points
              </p>
            </div>
            <div className="text-2xl">✓</div>
          </Card>
        </Link>
        
        <Link href="/referrals">
          <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer">
            <div>
              <h4 className="font-semibold">Invite Friends</h4>
              <p className="text-sm text-muted-foreground">
                Get 10% of their points forever
              </p>
            </div>
            <div className="text-2xl">👥</div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
