'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/useUserStore';
import { ReferralLink } from '@/components/features/referral/ReferralLink';
import { ReferralStats } from '@/components/features/referral/ReferralStats';
import { ReferralList } from '@/components/features/referral/ReferralList';
import { ShareButtons } from '@/components/features/referral/ShareButtons';

export default function ReferralsPage() {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite Friends 👥</h1>
        <p className="text-muted-foreground">
          Earn rewards for every friend you invite
        </p>
      </div>

      {/* Referral Stats */}
      <ReferralStats />

      {/* Referral Link */}
      <ReferralLink userId={user.id} />

      {/* Share Buttons */}
      <ShareButtons userId={user.id} />

      {/* Referral List */}
      <ReferralList />
    </div>
  );
}
