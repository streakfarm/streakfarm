'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, MessageCircle, Send } from 'lucide-react';
import { shareToTelegram, generateReferralLink } from '@/lib/utils/telegram';
import { APP_CONFIG } from '@/lib/utils/constants';

interface ShareButtonsProps {
  userId: string;
}

export function ShareButtons({ userId }: ShareButtonsProps) {
  const referralLink = generateReferralLink(userId, APP_CONFIG.BOT_USERNAME);
  const shareText = `🔥 Join me on StreakFarm! Build daily streaks and earn crypto rewards.

`;

  const handleTelegramShare = () => {
    shareToTelegram(shareText, referralLink);
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(referralLink)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share & Earn
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleTelegramShare}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          <Send className="mr-2 h-4 w-4" />
          Telegram
        </Button>
        <Button
          onClick={handleTwitterShare}
          className="w-full bg-sky-500 hover:bg-sky-600"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Twitter
        </Button>
      </CardContent>
    </Card>
  );
}
