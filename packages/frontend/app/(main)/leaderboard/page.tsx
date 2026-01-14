'use client';

import { useEffect, useState } from 'react';
import { leaderboardAPI } from '@/lib/api/leaderboard';
import { LeaderboardTable } from '@/components/features/leaderboard/LeaderboardTable';
import { TopThreeShowcase } from '@/components/features/leaderboard/TopThreeShowcase';
import { UserRankCard } from '@/components/features/leaderboard/UserRankCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaderboardType, LeaderboardData } from '@streakfarm/shared/types/leaderboard';

export default function LeaderboardPage() {
  const [globalData, setGlobalData] = useState<LeaderboardData | null>(null);
  const [weeklyData, setWeeklyData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const [global, weekly] = await Promise.all([
        leaderboardAPI.getLeaderboard(LeaderboardType.GLOBAL),
        leaderboardAPI.getLeaderboard(LeaderboardType.WEEKLY),
      ]);

      if (global.success) setGlobalData(global.data!);
      if (weekly.success) setWeeklyData(weekly.data!);
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard 🏆</h1>
        <p className="text-muted-foreground">
          Compete with others and climb the ranks
        </p>
      </div>

      {/* User Rank */}
      {globalData && <UserRankCard data={globalData} />}

      {/* Tabs */}
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6 space-y-6">
          {globalData && (
            <>
              <TopThreeShowcase entries={globalData.entries.slice(0, 3)} />
              <LeaderboardTable entries={globalData.entries} />
            </>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6 space-y-6">
          {weeklyData && (
            <>
              <TopThreeShowcase entries={weeklyData.entries.slice(0, 3)} />
              <LeaderboardTable entries={weeklyData.entries} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
