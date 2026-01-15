'use client';

import { useUserStore } from '@/lib/stores/useUserStore';

export function useStreak() {
  const { user, checkIn } = useUserStore();

  const canCheckIn = () => {
    if (!user?.last_checkin) return true;
    
    const lastCheckin = new Date(user.last_checkin);
    const now = new Date();
    const hoursSince = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
    
    return hoursSince >= 20; // Can check in after 20 hours
  };

  return {
    currentStreak: user?.current_streak || 0,
    longestStreak: user?.longest_streak || 0,
    lastCheckin: user?.last_checkin,
    canCheckIn: canCheckIn(),
    checkIn,
  };
}
