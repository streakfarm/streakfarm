import { useAuth } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/navigation/BottomNav";

const Profile = () => {
  const { user, isAuthenticated } = useAuth();

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      toast.success("Referral code copied!");
    }
  };

  const shareReferral = () => {
    if (user?.referral_code) {
      const text = `Join StreakFarm using my referral code: ${user.referral_code}`;
      if (navigator.share) {
        navigator.share({ text });
      } else {
        navigator.clipboard.writeText(text);
        toast.success("Referral message copied!");
      }
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Please authenticate first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {user.first_name || 'User'} {user.last_name || ''}
            </CardTitle>
            {user.username && (
              <p className="text-center text-gray-400">@{user.username}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Telegram ID</p>
              <p className="text-lg font-mono">{user.telegram_id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Referral Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Your Referral Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-400 font-mono">
                {user.referral_code || 'Loading...'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={copyReferralCode}
                variant="outline"
                className="w-full"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </Button>
              
              <Button
                onClick={shareReferral}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Points</span>
              <span className="font-bold">{user.total_points || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current Streak</span>
              <span className="font-bold">{user.current_streak || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Referrals</span>
              <span className="font-bold">{user.referral_count || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="bg-gray-800 border-gray-700 opacity-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
