import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/navigation/BottomNav";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  task_type: string;
  url?: string;
  is_completed?: boolean;
}

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    try {
      // Fetch all tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('points', { ascending: false });

      if (tasksError) throw tasksError;

      if (!user?.id) {
        setTasks(allTasks || []);
        setLoading(false);
        return;
      }

      // Fetch completed tasks for this user
      const { data: completedTasks, error: completedError } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('user_id', user.id);

      if (completedError) throw completedError;

      const completedTaskIds = new Set(
        completedTasks?.map((t) => t.task_id) || []
      );

      const tasksWithStatus = (allTasks || []).map((task) => ({
        ...task,
        is_completed: completedTaskIds.has(task.id),
      }));

      setTasks(tasksWithStatus);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (task: Task) => {
    if (!user?.id) {
      toast.error('Please authenticate first');
      return;
    }

    if (task.is_completed) {
      toast.info('Task already completed!');
      return;
    }

    try {
      // Open URL if exists
      if (task.url) {
        window.open(task.url, '_blank');
      }

      // Mark task as completed
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: user.id,
          task_id: task.id,
          points_earned: task.points,
          completed_at: new Date().toISOString(),
        });

      if (completionError) {
        if (completionError.code === '23505') {
          toast.info('Task already completed!');
        } else {
          throw completionError;
        }
      } else {
        // Update user points
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            total_points: (user.total_points || 0) + task.points,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        toast.success(`+${task.points} points! Task completed!`);
        loadTasks(); // Reload tasks
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold mb-6">Daily Tasks</h1>

        {tasks.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">No tasks available</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card
              key={task.id}
              className={`bg-gray-800 border-gray-700 ${
                task.is_completed ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{task.title}</span>
                  <span className="text-green-400 font-bold">
                    +{task.points} pts
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">{task.description}</p>

                <Button
                  onClick={() => completeTask(task)}
                  disabled={task.is_completed}
                  className={`w-full ${
                    task.is_completed
                      ? 'bg-green-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {task.is_completed ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Circle className="mr-2 h-5 w-5" />
                      Complete Task
                      {task.url && <ExternalLink className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Tasks;
