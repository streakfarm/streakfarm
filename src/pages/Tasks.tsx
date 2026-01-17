import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CheckinCard } from '@/components/tasks/CheckinCard';
import { TaskList } from '@/components/tasks/TaskList';
import { AdWatchCard } from '@/components/tasks/AdWatchCard';
import { WalletBanner } from '@/components/gamification/WalletBanner';
import { FireTrail } from '@/components/gamification/FireTrail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { CheckCircle2, ListTodo } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('available');
  const { completedTaskIds, tasks } = useTasks();
  
  const availableCount = tasks.filter(t => !completedTaskIds.has(t.id)).length;
  const completedCount = completedTaskIds.size;

  return (
    <AppLayout hideFloatingCTA>
      <div className="px-4 py-6 max-w-lg mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold mb-1"
          >
            📋 Daily Tasks
          </motion.h1>
          <p className="text-sm text-muted-foreground">
            Complete tasks to earn bonus points!
          </p>
        </div>

        {/* Wallet Banner */}
        <WalletBanner />

        {/* Streak Fire Trail */}
        <Card className="p-4 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            🔥 Daily Streak Progress
          </h3>
          <FireTrail />
        </Card>

        {/* Daily Checkin */}
        <CheckinCard />

        {/* Ad Watch Card */}
        <AdWatchCard />

        {/* Task Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="available" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Available
              {availableCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {availableCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
              {completedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold">
                  {completedCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <TaskList filter="available" />
          </TabsContent>

          <TabsContent value="completed">
            <TaskList filter="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
