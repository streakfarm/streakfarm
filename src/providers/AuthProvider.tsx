import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  telegram_id?: string;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
};

type AuthContextType = {
  profile: Profile | null;
  loading: boolean;
  loginWithTelegram: (initData: string, startParam?: string | null) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PROFILE_KEY = "sf_profile";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && data.session.user) {
          // optionally refresh profile state from /profiles table
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const loginWithTelegram = async (initData: string, startParam?: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, startParam }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Login failed");
      }

      if (json.tokens && json.tokens.access_token) {
        await supabase.auth.setSession({
          access_token: json.tokens.access_token,
          refresh_token: json.tokens.refresh_token,
        });
      } else if (json.fallbackAppToken) {
        localStorage.setItem("sf_app_token", json.fallbackAppToken);
      } else {
        console.warn("No tokens returned from telegram-auth function", json);
      }

      const p = json.profile;
      setProfile(p);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setProfile(null);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem("sf_app_token");
  };

  return <AuthContext.Provider value={{ profile, loading, loginWithTelegram, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}