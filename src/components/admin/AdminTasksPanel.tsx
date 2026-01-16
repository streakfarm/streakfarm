import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Repeat,
  Wallet
} from 'lucide-react';
import { useAdmin, Task } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const TASK_TYPES = ['daily', 'social', 'referral', 'wallet', 'onetime'] as const;
const TASK_STATUSES = ['active', 'inactive', 'expired'] as const;
const EMOJIS = ['📋', '🎯', '📢', '👥', '💰', '🎁', '🔥', '⭐', '💎', '🎮', '📺', '🔔'];

const defaultTask: Omit<Task, 'created_at'> = {
  id: '',
  title: '',
  description: '',
  icon_emoji: '📋',
  task_type: 'daily',
  status: 'active',
  points_reward: 100,
  is_repeatable: false,
  repeat_interval_hours: null,
  max_completions: null,
  requires_wallet: false,
  verification_type: 'auto',
  requirements: null,
  available_from: null,
  available_until: null,
  sort_order: 0,
};

export function AdminTasksPanel() {
  const { allTasks, tasksLoading, createTask, updateTask, deleteTask } = useAdmin();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<Omit<Task, 'created_at'>>(defaultTask);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm(task);
    } else {
      setEditingTask(null);
      setTaskForm({ ...defaultTask, id: `task_${Date.now()}` });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync(taskForm);
        toast.success('Task updated successfully');
      } else {
        await createTask.mutateAsync(taskForm);
        toast.success('Task created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save task');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTask.mutateAsync(deleteId);
      toast.success('Task deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'inactive': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-muted';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-orange-500/20 text-orange-400';
      case 'social': return 'bg-blue-500/20 text-blue-400';
      case 'referral': return 'bg-purple-500/20 text-purple-400';
      case 'wallet': return 'bg-cyan-500/20 text-cyan-400';
      case 'onetime': return 'bg-pink-500/20 text-pink-400';
      default: return 'bg-muted';
    }
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Tasks Management</h2>
          <p className="text-sm text-muted-foreground">{allTasks.length} total tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <Label>Icon</Label>
                  <Select 
                    value={taskForm.icon_emoji || '📋'} 
                    onValueChange={(v) => setTaskForm(prev => ({ ...prev, icon_emoji: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOJIS.map(emoji => (
                        <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>Title</Label>
                  <Input 
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea 
                  value={taskForm.description || ''}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={taskForm.task_type} 
                    onValueChange={(v: typeof TASK_TYPES[number]) => setTaskForm(prev => ({ ...prev, task_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={taskForm.status} 
                    onValueChange={(v: typeof TASK_STATUSES[number]) => setTaskForm(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points Reward</Label>
                  <Input 
                    type="number"
                    value={taskForm.points_reward}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, points_reward: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input 
                    type="number"
                    value={taskForm.sort_order}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Repeatable</Label>
                  <Switch 
                    checked={taskForm.is_repeatable || false}
                    onCheckedChange={(v) => setTaskForm(prev => ({ ...prev, is_repeatable: v }))}
                  />
                </div>
                {taskForm.is_repeatable && (
                  <div>
                    <Label>Repeat Interval (hours)</Label>
                    <Input 
                      type="number"
                      value={taskForm.repeat_interval_hours || ''}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, repeat_interval_hours: parseInt(e.target.value) || null }))}
                      placeholder="24"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>Requires Wallet</Label>
                  <Switch 
                    checked={taskForm.requires_wallet || false}
                    onCheckedChange={(v) => setTaskForm(prev => ({ ...prev, requires_wallet: v }))}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createTask.isPending || updateTask.isPending}
                >
                  {(createTask.isPending || updateTask.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingTask ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        <AnimatePresence>
          {allTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{task.icon_emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{task.title}</h3>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {task.status === 'inactive' && <XCircle className="w-3 h-3 mr-1" />}
                      {task.status === 'expired' && <Clock className="w-3 h-3 mr-1" />}
                      {task.status}
                    </Badge>
                    <Badge className={getTypeColor(task.task_type)}>
                      {task.task_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {task.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="text-primary font-medium">+{task.points_reward} pts</span>
                    {task.is_repeatable && (
                      <span className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {task.repeat_interval_hours}h
                      </span>
                    )}
                    {task.requires_wallet && (
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Wallet
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleOpenDialog(task)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(task.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {allTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks yet. Create your first task!
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task
              and all associated completion records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
