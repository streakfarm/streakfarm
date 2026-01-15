'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Flame, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { hapticFeedback } from '@/lib/utils/telegram';

export function DailyCheckin() {
  const user = useUserStore((state) => state.user);
  const checkIn = useUserStore((state) => state.checkIn);
  const [isChecking, setIsChecking] = useState(false);

  const canCheckIn = () => {
    if (!user?.last_checkin) return true;
    
    const lastCheckin = new Date(user.last_checkin);
    const now = new Date();
    const hoursSince = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);
    
    return hoursSince >= 20;
  };

  const handleCheckIn = async () => {
    setIsChecking(true);
    try {
      const result = await checkIn();
      hapticFeedback('success');
      toast.success(`🔥 ${result.new_streak} day streak! +${result.points_earned} points`);
    } catch (error: any) {
      hapticFeedback('error');
      toast.error(error.message || 'Check-in failed');
    } finally {
      setIsChecking(false);
    }
  };

  const isAvailable = canCheckIn();

  return (
    <Card className={isAvailable ? 'border-orange-500 shadow-lg' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Daily Check-in
        </CardTitle>
        <CardDescription>
          {isAvailable 
            ? 'Check in now to keep your streak alive!' 
            : 'Come back in 24 hours for your next check-in'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleCheckIn}
          disabled={!isAvailable || isChecking}
          className="w-full"
          size="lg"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking in...
            </>
          ) : isAvailable ? (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Check In Now
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Already Checked In
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
