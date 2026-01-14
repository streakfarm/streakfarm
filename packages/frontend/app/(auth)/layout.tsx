'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/lib/hooks/useTelegram';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useTelegram();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
