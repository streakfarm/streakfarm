import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

interface TonWalletProviderProps {
  children: ReactNode;
}

export const TonWalletProvider = ({ children }: TonWalletProviderProps) => {
  // Get manifest URL dynamically
  const manifestUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/tonconnect-manifest.json`
    : 'https://streakfarm.vercel.app/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/YOUR_BOT_USERNAME'
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};
