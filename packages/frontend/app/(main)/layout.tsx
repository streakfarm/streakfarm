'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user: tgUser } = useTelegram();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (!tgUser && !user) {
      router.push('/login');
    }
  }, [tgUser, user, router]);

  if (!user) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
