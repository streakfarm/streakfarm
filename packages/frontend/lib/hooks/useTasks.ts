'use client';

import { useTaskStore } from '@/lib/stores/useTaskStore';

export function useTasks() {
  const { tasks, isLoading, error, fetchTasks, startTask, completeTask } = useTaskStore();

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    startTask,
    completeTask,
  };
}
