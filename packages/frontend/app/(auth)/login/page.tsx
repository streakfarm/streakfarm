'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { useUserStore } from '@/lib/stores/useUserStore';
import { authenticateTelegram } from '@/lib/api/auth';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

export default function LoginPage() {
  const router = useRouter();
  const { initData, user: telegramUser } = useTelegram();
  const { setUser, setLoading, setError } = useUserStore();
  
  useEffect(() => {
    async function authenticate() {
      if (!initData || !telegramUser) {
        setError('Telegram data not available');
        return;
      }
      
      try {
        setLoading(true);
        
        const result = await authenticateTelegram(initData);
        
        setUser(result.user);
        
        // Check if this is first time user
        const isNewUser = new Date(result.user.created_at).getTime() > Date.now() - 60000;
        
        if (isNewUser) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      } catch (error: any) {
        setError(error.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }
    
    authenticate();
  }, [initData, telegramUser]);
  
  return <LoadingScreen />;
}
