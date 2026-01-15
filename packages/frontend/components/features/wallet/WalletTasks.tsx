'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export function WalletTasks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            Wallet tasks coming soon!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
