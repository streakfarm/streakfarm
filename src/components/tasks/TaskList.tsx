import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { 
  CheckCircle2, 
  Clock, 
  Coins, 
  ExternalLink,
  Twitter,
  MessageCircle,
  Users,
  Wallet,
  Gift,
  Zap,
  Lock,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  status: { completed: boolean; canComplete: boolean; nextAvailable: Date | null };
  onComplete: () => void;
  isLoading: boolean;
}

const taskIcons: Record<string, React.ReactNode> = {
  daily: <Zap className="w-5 h-5" />,
  social: <MessageCircle className="w-5 h-5" />,
  referral: <Users className="w-5 h-5" />,
  wallet: <Wallet className="w-5 h-5" />,
  onetime: <Gift className="w-5 h-5" />,
};

const taskTypeColors: Record<string, string> = {
  daily: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  social: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  referral: 'bg-green-500/20 text-green-400 border-green-500/30',
  wallet: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  onetime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

function TaskCard({ task, status, onComplete, isLoading }: TaskCardProps) {
  const { hapticFeedback } = useTelegram();
  const { profile } = useProfile();

  const handleClick = () => {
    if (status.completed || !status.canComplete) return;
    
    if (task.requires_wallet && !profile?.wallet_address) {
      toast.error('Connect your wallet first!');
      hapticFeedback('error');
      return;
    }

    hapticFeedback('medium');
    onComplete();
  };

  const formatTimeRemaining = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className={cn(
      "p-4 border transition-all duration-300",
      status.completed 
        ? "bg-muted/30 border-green-500/30" 
        : status.canComplete
          ? "bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
          : "bg-muted/20 border-border/50"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
          taskTypeColors[task.task_type]
        )}>
          {task.icon_emoji || taskIcons[task.task_type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={cn(
                "font-semibold",
                status.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>

            <Badge variant="outline" className={cn(
              "shrink-0",
              taskTypeColors[task.task_type]
            )}>
              {task.task_type}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-yellow-500">+{task.points_reward}</span>
              </div>
              
              {task.is_repeatable && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Repeatable
                </Badge>
              )}

              {task.requires_wallet && !profile?.wallet_address && (
                <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/30">
                  <Lock className="w-3 h-3 mr-1" />
                  Wallet
                </Badge>
              )}
            </div>

            {status.completed ? (
              <div className="flex items-center gap-1 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Done</span>
              </div>
            ) : status.nextAvailable ? (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatTimeRemaining(status.nextAvailable)}</span>
              </div>
            ) : (
              <Button 
                size="sm" 
                onClick={handleClick}
                disabled={isLoading || !status.canComplete}
                className="min-w-[80px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Go
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface TaskListProps {
  filter?: 'available' | 'completed' | 'all';
}

export function TaskList({ filter = 'all' }: TaskListProps) {
  const { tasks, tasksByType, getTaskStatus, completeTask, completedTaskIds } = useTasks();
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  const handleCompleteTask = async (taskId: string) => {
    setLoadingTaskId(taskId);
    try {
      await completeTask.mutateAsync({ taskId });
      toast.success('Task completed!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete task');
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Filter tasks based on filter prop
  const filterTasks = (taskList: Task[]) => {
    if (filter === 'available') {
      return taskList.filter(t => !completedTaskIds.has(t.id));
    }
    if (filter === 'completed') {
      return taskList.filter(t => completedTaskIds.has(t.id));
    }
    return taskList;
  };

  const taskGroups = [
    { title: '🔥 Daily Tasks', tasks: filterTasks(tasksByType.daily), key: 'daily' },
    { title: '📱 Social Tasks', tasks: filterTasks(tasksByType.social), key: 'social' },
    { title: '👥 Referral Tasks', tasks: filterTasks(tasksByType.referral), key: 'referral' },
    { title: '💰 Wallet Tasks', tasks: filterTasks(tasksByType.wallet), key: 'wallet' },
    { title: '🎁 One-time Tasks', tasks: filterTasks(tasksByType.onetime), key: 'onetime' },
  ];

  const hasAnyTasks = taskGroups.some(g => g.tasks.length > 0);

  return (
    <div className="space-y-6">
      {taskGroups.map(group => (
        group.tasks.length > 0 && (
          <div key={group.key}>
            <h2 className="text-lg font-semibold mb-3">{group.title}</h2>
            <div className="space-y-3">
              {group.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  status={getTaskStatus(task.id)}
                  onComplete={() => handleCompleteTask(task.id)}
                  isLoading={loadingTaskId === task.id}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {!hasAnyTasks && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">
            {filter === 'completed' ? '🎉' : '📋'}
          </div>
          <h3 className="font-semibold text-lg">
            {filter === 'completed' 
              ? 'No Completed Tasks Yet' 
              : filter === 'available'
              ? 'All Tasks Completed!'
              : 'No Tasks Available'}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            {filter === 'completed'
              ? 'Complete tasks to see them here!'
              : filter === 'available'
              ? 'Great job! Check back later for more.'
              : 'Check back later for new tasks!'}
          </p>
        </div>
      )}
    </div>
  );
}
