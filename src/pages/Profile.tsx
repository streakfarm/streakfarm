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
      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="flex items-center space-x-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {user.first_name || 'User'} {user.last_name || ''}
            </h2>
            {user.username && (
              <p className="text-sm text-gray-400">@{user.username}</p>
            )}
            <p className="text-xs text-gray-500 font-mono mt-1">
              ID: {user.telegram_id}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {user.total_points || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Points</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {user.current_streak || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Day Streak</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {user.referral_count || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">Referrals</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Card */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              🎁 Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-900 p-4 rounded-lg text-center border border-gray-700">
              <p className="text-2xl font-bold text-green-400 font-mono tracking-wider">
                {user.referral_code || 'Loading...'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={copyReferralCode}
                variant="outline"
                size="sm"
                className="w-full border-gray-600 hover:bg-gray-700"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              
              <Button
                onClick={shareReferral}
                size="sm"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <p className="text-xs text-center text-gray-400">
              Invite friends and earn bonus points! 🎉
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
