import { create } from 'zustand';
import { UserTask } from '@streakfarm/shared/types/task';
import { tasksAPI } from '@/lib/api/tasks';

interface TaskState {
  tasks: UserTask[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, verificationData?: any) => Promise<{ points_earned: number }>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.getTasks();
      if (response.success && response.data) {
        set({ tasks: response.data, isLoading: false });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch tasks');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  startTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.startTask(taskId);
      if (response.success && response.data) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.task_id === taskId ? response.data! : t)),
          isLoading: false,
        }));
      } else {
        throw new Error(response.error?.message || 'Failed to start task');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  completeTask: async (taskId: string, verificationData?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tasksAPI.completeTask(taskId, verificationData);
      if (response.success && response.data) {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.task_id === taskId ? response.data!.task : t)),
          isLoading: false,
        }));
        return { points_earned: response.data.points_earned };
      } else {
        throw new Error(response.error?.message || 'Failed to complete task');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
