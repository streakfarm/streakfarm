'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useBoxStore } from '@/lib/stores/useBoxStore';
import { useBadgeStore } from '@/lib/stores/useBadgeStore';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { getCurrentUser } from '@/lib/api/users';
import { getAvailableBoxes } from '@/lib/api/boxes';
import { getUserBadges, getAvailableBadges } from '@/lib/api/badges';
import { getTasks } from '@/lib/api/tasks';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useUserStore();
  const { setBoxes } = useBoxStore();
  const { setUserBadges, setAvailableBadges } = useBadgeStore();
  const { setTasks } = useTaskStore();
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Fetch boxes
  const { data: boxes } = useQuery({
    queryKey: ['boxes'],
    queryFn: getAvailableBoxes,
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Fetch badges
  const { data: userBadgesData } = useQuery({
    queryKey: ['badges', 'user'],
    queryFn: getUserBadges,
    enabled: !!user,
  });
  
  const { data: availableBadgesData } = useQuery({
    queryKey: ['badges', 'available'],
    queryFn: getAvailableBadges,
    enabled: !!user,
  });
  
  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
    enabled: !!user,
  });
  
  // Update stores
  useEffect(() => {
    if (userData) setUser(userData);
  }, [userData, setUser]);
  
  useEffect(() => {
    if (boxes) setBoxes(boxes);
  }, [boxes, setBoxes]);
  
  useEffect(() => {
    if (userBadgesData) setUserBadges(userBadgesData);
    if (availableBadgesData) setAvailableBadges(availableBadgesData);
  }, [userBadgesData, availableBadgesData, setUserBadges, setAvailableBadges]);
  
  useEffect(() => {
    if (tasksData) setTasks(tasksData);
  }, [tasksData, setTasks]);
  
  if (userLoading || !user) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
