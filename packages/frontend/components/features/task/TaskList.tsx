'use client';

import { useTaskStore } from '@/lib/stores/useTaskStore';
import { TaskCard } from './TaskCard';

export function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
