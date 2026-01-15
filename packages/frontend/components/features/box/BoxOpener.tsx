'use client';

import { useState } from 'react';
import { useBoxStore } from '@/lib/stores/useBoxStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { hapticFeedback } from '@/lib/utils/telegram';
import { formatPoints } from '@/lib/utils/format';

export function BoxOpener() {
  const availableBoxes = useBoxStore((state) => state.availableBoxes);
  const openBox = useBoxStore((state) => state.openBox);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const fetchAvailableBoxes = useBoxStore((state) => state.fetchAvailableBoxes);
  
  const [isOpening, setIsOpening] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [reward, setReward] = useState<number>(0);

  const handleOpenBox = async (boxId: string) => {
    setIsOpening(true);
    hapticFeedback('medium');

    try {
      const result = await openBox(boxId);
      
      // Show animation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setReward(result.total_points);
      setShowReward(true);
      hapticFeedback('success');
      
      toast.success(`🎁 You earned ${formatPoints(result.total_points)} points!`);
      
      // Refresh data
      await Promise.all([fetchUser(), fetchAvailableBoxes()]);
      
      // Hide reward after 2 seconds
      setTimeout(() => {
        setShowReward(false);
        setReward(0);
      }, 2000);
    } catch (error: any) {
      hapticFeedback('error');
      toast.error(error.message || 'Failed to open box');
    } finally {
      setIsOpening(false);
    }
  };

  if (availableBoxes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-500" />
            Mystery Boxes
          </CardTitle>
          <CardDescription>
            No boxes available right now. Check back in an hour!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-blue-500" />
          Mystery Boxes
        </CardTitle>
        <CardDescription>
          Open boxes to earn random point rewards!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {availableBoxes.map((box) => (
            <motion.div
              key={box.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => handleOpenBox(box.id)}
                disabled={isOpening}
                className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                {isOpening ? (
                  <Loader2 className="h-12 w-12 animate-spin" />
                ) : (
                  <>
                    <Gift className="h-12 w-12" />
                    <span className="text-sm">
                      {box.points_min}-{box.points_max} pts
                    </span>
                  </>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Reward Animation */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <div className="text-center">
                <Sparkles className="h-24 w-24 text-yellow-400 mx-auto mb-4 animate-pulse" />
                <p className="text-4xl font-bold text-white">+{formatPoints(reward)}</p>
                <p className="text-xl text-white/80 mt-2">Points Earned!</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
