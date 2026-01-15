import { create } from 'zustand';
import { User } from '@streakfarm/shared/types/user';
import { usersAPI } from '@/lib/api/users';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  checkIn: () => Promise<{ points_earned: number; new_streak: number }>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.getMe();
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch user');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.updateProfile(data);
      if (response.success && response.data) {
        set({ user: response.data, isLoading: false });
      } else {
        throw new Error(response.error?.message || 'Failed to update user');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  checkIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await usersAPI.checkIn();
      if (response.success && response.data) {
        // Refresh user data after check-in
        await get().fetchUser();
        set({ isLoading: false });
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Check-in failed');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearUser: () => set({ user: null, error: null }),
}));
