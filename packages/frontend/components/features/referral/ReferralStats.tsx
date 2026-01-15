'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, TrendingUp, Gift } from 'lucide-react';
import { referralsAPI } from '@/lib/api/referrals';
import { ReferralStats as ReferralStatsType } from '@streakfarm/shared/types/referral';
import { formatPoints } from '@/lib/utils/format';

export function ReferralStats() {
  const [stats, setStats] = useState<ReferralStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await referralsAPI.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Total Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">{stats.total_referrals}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Active</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">{stats.active_referrals}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Points Earned</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">{formatPoints(stats.total_points_earned)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Current Tier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            <p className="text-2xl font-bold">Tier {stats.current_tier}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
