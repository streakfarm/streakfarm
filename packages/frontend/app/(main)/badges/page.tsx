'use client';

import { useState } from 'react';
import { BadgeGrid } from '@/components/features/badge/BadgeGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBadgeStore } from '@/lib/stores/useBadgeStore';
import { useUserStore } from '@/lib/stores/useUserStore';

export default function BadgesPage() {
  const { userBadges, availableBadges } = useBadgeStore();
  const { user } = useUserStore();
  
  const totalMultiplier = user?.multiplier_permanent || 1.0;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">My Badges</h1>
        <p className="text-muted-foreground">
          Total Multiplier: <span className="font-semibold text-primary">
            {totalMultiplier.toFixed(1)}×
          </span>
        </p>
      </div>
      
      <Tabs defaultValue="owned" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="owned">
            Owned ({userBadges.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availableBadges.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="owned" className="mt-6">
          <BadgeGrid badges={userBadges} />
        </TabsContent>
        
        <TabsContent value="available" className="mt-6">
          <BadgeGrid badges={availableBadges} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
