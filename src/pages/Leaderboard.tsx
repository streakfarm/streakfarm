import { AppLayout } from '@/components/layout/AppLayout';
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView';

const Leaderboard = () => {
  return (
    <AppLayout>
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
        <LeaderboardView />
      </div>
    </AppLayout>
  );
};

export default Leaderboard;
