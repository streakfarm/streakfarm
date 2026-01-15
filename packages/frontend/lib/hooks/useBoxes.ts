'use client';

import { useBoxStore } from '@/lib/stores/useBoxStore';

export function useBoxes() {
  const {
    availableBoxes,
    boxHistory,
    isLoading,
    error,
    fetchAvailableBoxes,
    fetchBoxHistory,
    openBox,
  } = useBoxStore();

  return {
    availableBoxes,
    boxHistory,
    isLoading,
    error,
    fetchAvailableBoxes,
    fetchBoxHistory,
    openBox,
  };
}
