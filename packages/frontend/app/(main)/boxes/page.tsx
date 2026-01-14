'use client';

import { useEffect } from 'react';
import { useBoxStore } from '@/lib/stores/useBoxStore';
import { BoxOpener } from '@/components/features/box/BoxOpener';
import { BoxHistory } from '@/components/features/box/BoxHistory';
import { BoxStats } from '@/components/features/box/BoxStats';

export default function BoxesPage() {
  const fetchAvailableBoxes = useBoxStore((state) => state.fetchAvailableBoxes);
  const fetchBoxHistory = useBoxStore((state) => state.fetchBoxHistory);

  useEffect(() => {
    fetchAvailableBoxes();
    fetchBoxHistory();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mystery Boxes 🎁</h1>
        <p className="text-muted-foreground">
          Open boxes to earn points and rewards
        </p>
      </div>

      {/* Box Stats */}
      <BoxStats />

      {/* Box Opener */}
      <BoxOpener />

      {/* Box History */}
      <BoxHistory />
    </div>
  );
}
