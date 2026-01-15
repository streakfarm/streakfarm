import { create } from 'zustand';
import { Box, BoxOpenResult } from '@streakfarm/shared/types/box';
import { boxesAPI } from '@/lib/api/boxes';

interface BoxState {
  availableBoxes: Box[];
  boxHistory: Box[];
  isLoading: boolean;
  error: string | null;

  fetchAvailableBoxes: () => Promise<void>;
  fetchBoxHistory: () => Promise<void>;
  openBox: (boxId: string) => Promise<BoxOpenResult>;
}

export const useBoxStore = create<BoxState>((set) => ({
  availableBoxes: [],
  boxHistory: [],
  isLoading: false,
  error: null,

  fetchAvailableBoxes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await boxesAPI.getAvailableBoxes();
      if (response.success && response.data) {
        set({ availableBoxes: response.data, isLoading: false });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch boxes');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchBoxHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await boxesAPI.getBoxHistory();
      if (response.success && response.data) {
        set({ boxHistory: response.data.data, isLoading: false });
      } else {
        throw new Error(response.error?.message || 'Failed to fetch history');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  openBox: async (boxId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await boxesAPI.openBox(boxId);
      if (response.success && response.data) {
        set({ isLoading: false });
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to open box');
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
