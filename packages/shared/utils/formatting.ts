export function formatPoints(points: number): string {
  if (points >= 1_000_000_000) {
    return `${(points / 1_000_000_000).toFixed(2)}B`;
  }
  if (points >= 1_000_000) {
    return `${(points / 1_000_000).toFixed(2)}M`;
  }
  if (points >= 1_000) {
    return `${(points / 1_000).toFixed(2)}K`;
  }
  return points.toLocaleString();
}

export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}×`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) return '00:00:00';

  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
