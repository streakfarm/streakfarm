'use client';

import { useState } from 'react';
import { UserTask, TaskStatus } from '@streakfarm/shared/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { openTelegramLink, hapticFeedback } from '@/lib/utils/telegram';
import { formatPoints } from '@/lib/utils/format';
import toast from 'react-hot-toast';

interface TaskCardProps {
  task: UserTask;
}

export function TaskCard({ task }: TaskCardProps) {
  const startTask = useTaskStore((state) => state.startTask);
  const completeTask = useTaskStore((state) => state.completeTask);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStart = async () => {
    if (task.task?.action_url) {
      openTelegramLink(task.task.action_url);
    }

    setIsProcessing(true);
    hapticFeedback('medium');

    try {
      await startTask(task.task_id);
      toast.success('Task started! Complete it to earn rewards.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    hapticFeedback('medium');

    try {
      const result = await completeTask(task.task_id);
      hapticFeedback('success');
      toast.success(`🎉 Task completed! +${formatPoints(result.points_earned)} points`);
      await fetchUser();
    } catch (error: any) {
      hapticFeedback('error');
      toast.error(error.message || 'Failed to complete task');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case TaskStatus.COMPLETED:
        return <Badge className="bg-green-500">Completed</Badge>;
      case TaskStatus.IN_PROGRESS:
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case TaskStatus.PENDING_VERIFICATION:
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{task.task?.icon || '📋'}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{task.task?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {task.task?.description}
                </p>
                
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <span>+{formatPoints(task.task?.points_reward || 0)}</span>
                  </div>
                  {task.task?.box_reward && (
                    <Badge variant="secondary" className="text-xs">
                      +1 Box
                    </Badge>
                  )}
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>

          <div>
            {task.status === TaskStatus.COMPLETED ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.PENDING_VERIFICATION ? (
              <Button
                onClick={handleComplete}
                disabled={isProcessing}
                size="sm"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={isProcessing}
                size="sm"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Start
                    {task.task?.action_url && <ExternalLink className="ml-1 h-3 w-3" />}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
