'use client';

import { useEffect } from 'react';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { TaskList } from '@/components/features/task/TaskList';
import { TaskTabs } from '@/components/features/task/TaskTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function TasksPage() {
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const tasks = useTaskStore((state) => state.tasks);

  useEffect(() => {
    fetchTasks();
  }, []);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks & Challenges 🎯</h1>
        <p className="text-muted-foreground">
          Complete tasks to earn extra points and rewards
        </p>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                {completedCount} of {tasks.length} tasks completed
              </CardDescription>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs */}
      <TaskTabs />

      {/* Task List */}
      <TaskList />
    </div>
  );
}
