import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Copy, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { toast } from 'sonner';

export function FloatingCTA() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { profile } = useProfile();
  const { hapticFeedback, shareRef } = useTelegram();

  const referralLink = `https://t.me/StreakFarmBot?start=${profile?.ref_code || ''}`;

  const handleOpen = () => {
    hapticFeedback('medium');
    setIsOpen(true);
  };

  const handleClose = () => {
    hapticFeedback('light');
    setIsOpen(false);
  };

  const handleCopy = async () => {
    hapticFeedback('success');
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    hapticFeedback('medium');
    if (profile?.ref_code) {
      shareRef(profile.ref_code);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={handleOpen}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Gift className="w-6 h-6 text-white" />
        </motion.div>
        
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary"
          animate={{ 
            scale: [1, 1.5],
            opacity: [0.5, 0]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      </motion.button>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="fixed bottom-[6.5rem] right-20 z-40 bg-card border border-border rounded-lg px-3 py-1.5 shadow-lg"
      >
        <span className="text-xs font-medium whitespace-nowrap">
          Invite & Earn <span className="text-primary font-bold">500pts</span>
        </span>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-card border-r border-b border-border rotate-45" />
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={handleClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card className="rounded-t-3xl rounded-b-none p-6 border-t-2 border-primary/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Invite Friends</h3>
                      <p className="text-sm text-muted-foreground">
                        Earn 500 points per referral!
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleClose}
                    className="p-2 rounded-full bg-muted hover:bg-muted/80"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <span className="text-3xl font-bold text-primary">
                      {profile?.total_referrals || 0}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Friends Invited</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <span className="text-3xl font-bold text-yellow-500">
                      {((profile?.total_referrals || 0) * 500).toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Points Earned</p>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="bg-muted/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono truncate text-muted-foreground">
                    {referralLink}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Share Button */}
                <Button 
                  onClick={handleShare}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share with Friends
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
