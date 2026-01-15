'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { referralsAPI } from '@/lib/api/referrals';
import { Referral } from '@streakfarm/shared/types/referral';
import { formatTimeAgo, formatPoints } from '@/lib/utils/format';

export function ReferralList() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await referralsAPI.getReferrals();
      if (response.success && response.data) {
        setReferrals(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No referrals yet. Start inviting friends!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Referrals ({referrals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Friend #{referral.referred_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(referral.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  +{formatPoints(referral.points_earned)}
                </p>
                {referral.referred_user_active ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400 ml-auto" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
