import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { 
  Copy, 
  Check, 
  Users, 
  Gift, 
  Share2, 
  Twitter,
  MessageCircle,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const REFERRAL_BONUS = 100;
const REFEREE_BONUS = 50;

export function ReferralCard() {
  const { profile } = useProfile();
  const { hapticFeedback, webApp } = useTelegram();
  const [copied, setCopied] = useState(false);

  const referralLink = `https://t.me/StreakFarmBot?start=${profile?.ref_code || ''}`;
  const referralCode = profile?.ref_code || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      hapticFeedback('light');
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = () => {
    hapticFeedback('medium');
    
    if (webApp?.openTelegramLink) {
      const shareText = `🚀 Join StreakFarm and earn points!\n\nUse my referral code: ${referralCode}\n\n${referralLink}`;
      webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`);
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}`);
    }
  };

  const handleTwitterShare = () => {
    hapticFeedback('medium');
    const text = `🔥 I'm farming points on @StreakFarm! Join me and earn bonus rewards 🎁\n\nUse my code: ${referralCode}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`);
  };

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Your Referrals</h3>
            <p className="text-sm text-muted-foreground">Invite friends, earn rewards</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{profile?.total_referrals || 0}</div>
            <div className="text-sm text-muted-foreground">Friends Invited</div>
          </div>
          <div className="bg-background/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {((profile?.total_referrals || 0) * REFERRAL_BONUS).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Points Earned</div>
          </div>
        </div>
      </Card>

      {/* Rewards Info */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-500" />
          Referral Rewards
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">You get per referral</span>
            <span className="font-semibold flex items-center gap-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              +{REFERRAL_BONUS} points
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your friend gets</span>
            <span className="font-semibold flex items-center gap-1">
              <Coins className="w-4 h-4 text-green-500" />
              +{REFEREE_BONUS} bonus
            </span>
          </div>
        </div>
      </Card>

      {/* Referral Link */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Your Referral Link</h4>
        <div className="flex gap-2">
          <Input 
            value={referralLink} 
            readOnly 
            className="bg-muted text-sm"
          />
          <Button
            size="icon"
            variant={copied ? "default" : "outline"}
            onClick={handleCopy}
            className={cn(copied && "bg-green-500 hover:bg-green-600")}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button className="flex-1" onClick={handleShare}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on Telegram
          </Button>
          <Button variant="outline" onClick={handleTwitterShare}>
            <Twitter className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4 bg-muted/30">
        <h4 className="font-semibold mb-2">💡 Tips to get more referrals</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Share in crypto/gaming communities</li>
          <li>• Post about your streak achievements</li>
          <li>• Invite friends who love earning rewards</li>
        </ul>
      </Card>
    </div>
  );
}
