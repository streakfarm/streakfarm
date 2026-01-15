'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/useUserStore';

export function useUser() {
  const { user, isLoading, error, fetchUser } = useUserStore();

  useEffect(() => {
    if (!user && !isLoading) {
      fetchUser();
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  };
}
