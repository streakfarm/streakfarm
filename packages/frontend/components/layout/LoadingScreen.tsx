import { Loader2, Flame } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Flame className="h-16 w-16 text-white animate-pulse" />
          <Loader2 className="absolute inset-0 h-16 w-16 text-white/50 animate-spin" />
        </div>
        <p className="text-white font-semibold text-lg">Loading StreakFarm...</p>
      </div>
    </div>
  );
}
