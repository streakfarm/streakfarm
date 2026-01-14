'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Flame } from 'lucide-react';
import { authAPI } from '@/lib/api/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { webApp, user: tgUser } = useTelegram();
  const setUser = useUserStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!webApp) {
      toast.error('Telegram WebApp not available');
      return;
    }

    setIsLoading(true);

    try {
      const initData = webApp.initData;
      
      if (!initData) {
        throw new Error('No init data available');
      }

      const response = await authAPI.login(initData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Check if onboarding is needed
        if (response.data.is_new_user) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-login if Telegram data is available
  useEffect(() => {
    if (webApp && !isLoading) {
      handleLogin();
    }
  }, [webApp]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
            <Flame className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">StreakFarm</CardTitle>
          <CardDescription className="text-lg">
            Never Miss. Build Streaks. Earn Rewards. 🔥
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              'Start Farming Streaks'
            )}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
