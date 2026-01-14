'use client';

import { useEffect } from 'react';
import { useBadgeStore } from '@/lib/stores/useBadgeStore';
import { BadgeGrid } from '@/components/features/badge/BadgeGrid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Lock } from 'lucide-react';

export default function BadgesPage() {
  const fetchBadges = useBadgeStore((state) => state.fetchBadges);
  const badges = useBadgeStore((state) => state.badges);

  useEffect(() => {
    fetchBadges();
  }, []);

  const unlockedCount = badges.filter((b) => b.is_unlocked).length;
  const totalMultiplier = badges
    .filter((b) => b.is_unlocked)
    .reduce((sum, b) => sum + (b.badge?.multiplier_bonus || 0), 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Badges & Achievements 🏆</h1>
        <p className="text-muted-foreground">
          Unlock badges to earn permanent multipliers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <p className="text-2xl font-bold">
                {unlockedCount}/{badges.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Bonus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-500" />
              <p className="text-2xl font-bold">+{totalMultiplier.toFixed(1)}×</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <BadgeGrid badges={badges} />
        </TabsContent>

        <TabsContent value="unlocked" className="mt-6">
          <BadgeGrid badges={badges.filter((b) => b.is_unlocked)} />
        </TabsContent>

        <TabsContent value="locked" className="mt-6">
          <BadgeGrid badges={badges.filter((b) => !b.is_unlocked)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
