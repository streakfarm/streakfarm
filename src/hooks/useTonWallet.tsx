import { TonConnectUIProvider, useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TonWalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
}

const TonWalletContext = createContext<TonWalletContextType | null>(null);

// Use manifest from public folder - will work in both preview and production
const getManifestUrl = () => {
  // In production, use the full URL
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/tonconnect-manifest.json`;
  }
  return '/tonconnect-manifest.json';
};

export function TonWalletProvider({ children }: { children: ReactNode }) {
  const [manifestUrl] = useState(getManifestUrl);
  
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TonWalletInner>{children}</TonWalletInner>
    </TonConnectUIProvider>
  );
}

function TonWalletInner({ children }: { children: ReactNode }) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { updateProfile, profile, isAuthenticated } = useProfile();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();
  const [hasAwardedBadge, setHasAwardedBadge] = useState(false);

  const walletAddress = wallet?.account?.address || null;
  const isConnected = !!wallet;

  // Sync wallet to profile and award badge when connected
  useEffect(() => {
    const syncWalletAndAwardBadge = async () => {
      if (!walletAddress || !isAuthenticated || !profile?.id) return;
      
      // Update profile with wallet info
      try {
        await updateProfile.mutateAsync({
          wallet_address: walletAddress,
          wallet_type: 'ton',
        });

        // Award wallet badge if not already awarded
        if (!hasAwardedBadge && !profile.wallet_address) {
          const { data: session } = await supabase.auth.getSession();
          if (!session?.session?.access_token) return;

          // Call edge function to award wallet badge
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-wallet-badge`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session.access_token}`,
              },
              body: JSON.stringify({ walletAddress }),
            }
          );

          const result = await response.json();
          
          if (response.ok && result.success) {
            setHasAwardedBadge(true);
            hapticFeedback('success');
            toast.success(`🎉 Wallet Badge Earned! +${result.points_awarded} points`, {
              description: result.badge_name || 'TON Holder badge unlocked!',
            });
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['badges'] });
            queryClient.invalidateQueries({ queryKey: ['user-badges'] });
          }
        }
      } catch (error) {
        console.error('Error syncing wallet:', error);
      }
    };

    syncWalletAndAwardBadge();
  }, [walletAddress, isAuthenticated, profile?.id, hasAwardedBadge]);

  const connect = useCallback(async () => {
    try {
      hapticFeedback('medium');
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      hapticFeedback('error');
      toast.error('Failed to connect wallet');
    }
  }, [tonConnectUI, hapticFeedback]);

  const disconnect = useCallback(async () => {
    try {
      hapticFeedback('light');
      await tonConnectUI.disconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [tonConnectUI, hapticFeedback]);

  const value: TonWalletContextType = {
    isConnected,
    walletAddress,
    connect,
    disconnect,
    isConnecting: false,
  };

  return (
    <TonWalletContext.Provider value={value}>
      {children}
    </TonWalletContext.Provider>
  );
}

export function useTonWalletContext() {
  const context = useContext(TonWalletContext);
  if (!context) {
    // Return mock for non-wallet contexts
    return {
      isConnected: false,
      walletAddress: null,
      connect: async () => {},
      disconnect: async () => {},
      isConnecting: false,
    };
  }
  return context;
}

// Re-export the official connect button
export { TonConnectButton };
