'use client';

import { useUserStore } from '@/lib/stores/useUserStore';
import { ProfileHeader } from '@/components/features/profile/ProfileHeader';
import { StatsGrid } from '@/components/features/profile/StatsGrid';
import { AchievementTimeline } from '@/components/features/profile/AchievementTimeline';

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Stats Grid */}
      <StatsGrid user={user} />

      {/* Achievement Timeline */}
      <AchievementTimeline />
    </div>
  );
}
