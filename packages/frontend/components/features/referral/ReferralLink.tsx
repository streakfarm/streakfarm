'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { generateReferralLink, hapticFeedback } from '@/lib/utils/telegram';
import { APP_CONFIG } from '@/lib/utils/constants';
import toast from 'react-hot-toast';

interface ReferralLinkProps {
  userId: string;
}

export function ReferralLink({ userId }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = generateReferralLink(userId, APP_CONFIG.BOT_USERNAME);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      hapticFeedback('success');
      toast.success('Link copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Link</CardTitle>
        <CardDescription>
          Share this link with friends to earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            onClick={handleCopy}
            variant={copied ? 'default' : 'outline'}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
