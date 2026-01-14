'use client';

import { TaskList } from '@/components/features/task/TaskList';
import { useTaskStore } from '@/lib/stores/useTaskStore';

export default function TasksPage() {
  const { tasks } = useTaskStore();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Tasks</h1>
        <p className="text-muted-foreground">
          Complete tasks to earn points
        </p>
      </div>
      
      <TaskList tasks={tasks} />
    </div>
  );
}
