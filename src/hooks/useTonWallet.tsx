import { TonConnectUIProvider, useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TonWalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  syncWalletToProfile: () => Promise<void>;
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
  const { profile, isAuthenticated, refreshProfile } = useProfile();
  const { hapticFeedback, user: telegramUser, isTelegram } = useTelegram();
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [hasAwardedBadge, setHasAwardedBadge] = useState(false);
  const [lastAuthUserId, setLastAuthUserId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);

  const walletAddress = wallet?.account?.address || null;
  const isConnected = !!wallet;

  // Disconnect wallet when user changes (e.g., from referral link)
  useEffect(() => {
    if (authUser?.id && lastAuthUserId && authUser.id !== lastAuthUserId) {
      console.log("User changed. Disconnecting wallet...");
      tonConnectUI.disconnect();
      setHasAwardedBadge(false);
      setSyncAttempted(false);
    }
    
    if (authUser?.id) {
      setLastAuthUserId(authUser.id);
    }
  }, [authUser?.id, lastAuthUserId, tonConnectUI]);

  // Reset badge award state when user changes
  useEffect(() => {
    if (authUser?.id !== lastAuthUserId) {
      setHasAwardedBadge(false);
      setSyncAttempted(false);
    }
  }, [authUser?.id, lastAuthUserId]);

  // Sync wallet from profile on mount (for cross-device sync)
  useEffect(() => {
    const syncWalletFromProfile = async () => {
      if (!profile?.wallet_address || !isAuthenticated) return;
      
      // If profile has wallet but TonConnect doesn't show connected, 
      // we can't auto-connect (user needs to manually connect for security)
      // But we can show the wallet is linked
      console.log("Profile has wallet:", profile.wallet_address);
    };

    syncWalletFromProfile();
  }, [profile?.wallet_address, isAuthenticated]);

  // Sync wallet to profile and award badge when connected
  const syncWalletToProfile = useCallback(async () => {
    if (!walletAddress || !isAuthenticated || !profile?.id) {
      console.log("Cannot sync wallet - missing data:", { walletAddress, isAuthenticated, profileId: profile?.id });
      return;
    }
    
    // Prevent duplicate sync attempts
    if (syncAttempted) {
      console.log("Wallet sync already attempted");
      return;
    }
    
    setSyncAttempted(true);
    console.log("Syncing wallet to profile...", walletAddress);
    
    try {
      // Update profile with wallet info first
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          wallet_address: walletAddress,
          wallet_type: 'ton',
          last_active_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating profile wallet:', updateError);
      }

      // Award wallet badge if not already awarded
      if (!hasAwardedBadge && !profile.wallet_connected_at) {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          console.log("No session token available");
          return;
        }

        console.log("Calling award-wallet-badge function...");
        
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
        console.log("Award wallet badge response:", result);
        
        if (response.ok && result.success) {
          setHasAwardedBadge(true);
          hapticFeedback('success');
          toast.success(`🎉 ${result.message}`, {
            description: `+${result.points_awarded} points awarded!`,
          });
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.invalidateQueries({ queryKey: ['badges'] });
          queryClient.invalidateQueries({ queryKey: ['user-badges'] });
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          
          // Refresh profile to get updated data
          await refreshProfile();
        } else if (result.message?.includes('already connected')) {
          console.log("Wallet reward already claimed");
          setHasAwardedBadge(true);
        }
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
    }
  }, [walletAddress, isAuthenticated, profile?.id, profile?.wallet_connected_at, hasAwardedBadge, hapticFeedback, queryClient, refreshProfile, syncAttempted]);

  // Auto-sync when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress && !syncAttempted) {
      syncWalletToProfile();
    }
  }, [isConnected, walletAddress, syncAttempted, syncWalletToProfile]);

  // Reset sync attempt when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setSyncAttempted(false);
      setHasAwardedBadge(false);
    }
  }, [isConnected]);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      hapticFeedback('medium');
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      hapticFeedback('error');
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [tonConnectUI, hapticFeedback]);

  const disconnect = useCallback(async () => {
    try {
      hapticFeedback('light');
      await tonConnectUI.disconnect();
      
      // Update profile to remove wallet
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({
            wallet_address: null,
            wallet_type: null,
            last_active_at: new Date().toISOString(),
          })
          .eq('id', profile.id);
        
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
      
      setSyncAttempted(false);
      setHasAwardedBadge(false);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [tonConnectUI, hapticFeedback, profile?.id, queryClient]);

  const value: TonWalletContextType = {
    isConnected,
    walletAddress,
    connect,
    disconnect,
    isConnecting,
    syncWalletToProfile,
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
      syncWalletToProfile: async () => {},
    };
  }
  return context;
}

// Re-export the official connect button
export { TonConnectButton };
