import { useProfile } from '@/hooks/useProfile';
import { Wallet, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';

export function WalletButton() {
  const { profile } = useProfile();
  const { hapticFeedback } = useTelegram();

  const isConnected = !!profile?.wallet_address;
  const displayAddress = profile?.wallet_address 
    ? `${profile.wallet_address.slice(0, 4)}...${profile.wallet_address.slice(-4)}`
    : null;

  const handleConnect = () => {
    hapticFeedback('medium');
    // TODO: Implement TON Connect
    console.log('Connect wallet clicked');
  };

  return (
    <button
      onClick={handleConnect}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
        isConnected 
          ? 'bg-primary/10 text-primary border border-primary/30'
          : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
      )}
    >
      {isConnected ? (
        <>
          <Check className="w-4 h-4" />
          <span>{displayAddress}</span>
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4" />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}
