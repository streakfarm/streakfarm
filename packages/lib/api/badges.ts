import { apiClient } from './client';
import type { Badge, BadgeWithProgress } from '@streakfarm/shared';

export async function getUserBadges(): Promise<Badge[]> {
  return apiClient.get<Badge[]>('/badges/me');
}

export async function getAvailableBadges(): Promise<BadgeWithProgress[]> {
  return apiClient.get<BadgeWithProgress[]>('/badges/available');
}

export async function checkBadges(): Promise<{ new_badges: Badge[] }> {
  return apiClient.post<{ new_badges: Badge[] }>('/badges/check');
}
