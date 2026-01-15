'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { TaskStatus } from '@streakfarm/shared/types/task';

export function TaskTabs() {
  const tasks = useTaskStore((state) => state.tasks);

  const availableTasks = tasks.filter((t) => t.status === TaskStatus.AVAILABLE);
  const inProgressTasks = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.PENDING_VERIFICATION
  );
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);

  return (
    <Tabs defaultValue="available" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="available">
          Available ({availableTasks.length})
        </TabsTrigger>
        <TabsTrigger value="progress">
          In Progress ({inProgressTasks.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completedTasks.length})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
