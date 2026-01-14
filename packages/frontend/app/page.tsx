'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

export default function HomePage() {
  const router = useRouter();
  const { user, webApp } = useTelegram();

  useEffect(() => {
    if (webApp) {
      // Check if user is authenticated
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, webApp, router]);

  return <LoadingScreen />;
}
