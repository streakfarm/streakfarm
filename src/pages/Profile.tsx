import { useAuth } from "@/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

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
      <AppLayout showHeader={false} showNav={false} showCTA={false}>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400">Please authenticate first</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
            </div>
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
              <span className="font-bold text-green-400">{user.total_points || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Current Streak</span>
              <span className="font-bold text-green-400">{user.current_streak || 0} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Referrals</span>
              <span className="font-bold text-green-400">{user.referral_count || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
