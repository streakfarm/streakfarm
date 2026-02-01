import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from '@/hooks/useTelegram';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authError: null,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to completely clear all local/session storage
function clearAllStorage() {
  try {
    // Clear localStorage
    const keysToKeep = ['theme', 'language']; // Keep non-auth related keys
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear IndexedDB (used by TonConnect)
    if (window.indexedDB) {
      const dbs = ['tonconnect', 'supabase'];
      dbs.forEach(dbName => {
        try {
          const req = indexedDB.deleteDatabase(dbName);
          req.onsuccess = () => console.log(`Cleared IndexedDB: ${dbName}`);
        } catch (e) {
          console.log(`Could not clear IndexedDB: ${dbName}`);
        }
      });
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { initData, isReady, isTelegram, hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();
  
  // Use refs to track state
  const loginAttempted = useRef(false);
  const lastTelegramIdRef = useRef<number | null>(null);
  const sessionInitializedRef = useRef(false);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth event:', event, 'Session:', !!currentSession);
      setSession(currentSession);
      
      if (currentSession) {
        setIsLoading(false);
        sessionInitializedRef.current = true;
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        setIsLoading(false);
        sessionInitializedRef.current = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. The Official Auto-Login Flow with Complete Session Cleanup
  useEffect(() => {
    if (!isReady || !isTelegram || !initData) {
      console.log("Not ready for auto-login yet");
      if (sessionInitializedRef.current) {
        setIsLoading(false);
      }
      return;
    }

    // Extract Telegram user ID from initData
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    const telegramUser = userJson ? JSON.parse(userJson) : null;
    const currentTelegramId = telegramUser?.id;

    if (!currentTelegramId) {
      console.log("No Telegram user ID found");
      setIsLoading(false);
      return;
    }

    // Check if this is a different user (referral link case)
    if (lastTelegramIdRef.current && lastTelegramIdRef.current !== currentTelegramId) {
      console.log("Different Telegram user detected. Clearing all storage and logging out...");
      clearAllStorage();
      supabase.auth.signOut();
      loginAttempted.current = false;
      queryClient.clear();
    }

    lastTelegramIdRef.current = currentTelegramId;

    // If already logged in and it's the same user, skip
    if (session?.user?.user_metadata?.telegram_id === currentTelegramId) {
      console.log("Already logged in as this user");
      setIsLoading(false);
      return;
    }

    // If already attempted login, don't try again
    if (loginAttempted.current) {
      console.log("Login already attempted");
      return;
    }
    
    loginAttempted.current = true;
    setIsLoading(true);
    console.log("Starting Official Telegram Auto-Login...");

    const performLogin = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ initData }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Authentication failed');
        }

        if (result.session) {
          const { error } = await supabase.auth.setSession(result.session);
          if (error) throw error;
          console.log("Auto-login successful!");
          sessionInitializedRef.current = true;
        } else {
          throw new Error("Invalid response from auth server");
        }
      } catch (err: any) {
        console.error("Auto-login failed:", err.message);
        setAuthError(err.message);
        toast.error("Login failed. Please reload the app.");
        setIsLoading(false);
      }
    };

    performLogin();
  }, [isReady, isTelegram, initData]);

  const signOut = async () => {
    clearAllStorage();
    await supabase.auth.signOut();
    setSession(null);
    loginAttempted.current = false;
    lastTelegramIdRef.current = null;
    sessionInitializedRef.current = false;
    queryClient.clear();
  };

  // Show loading state while initializing to prevent blinking
  if (isLoading) {
    return (
      <AuthContext.Provider
        value={{
          session: null,
          user: null,
          isLoading: true,
          isAuthenticated: false,
          authError,
          signOut,
        }}
      >
        <div className="flex items-center justify-center w-full h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Initializing...</p>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading: false,
        isAuthenticated: !!session,
        authError,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
