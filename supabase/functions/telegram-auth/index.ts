import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

/* -------------------- TELEGRAM INIT DATA VALIDATION -------------------- */
async function validateTelegramData(
  initData: string,
  botToken: string
): Promise<TelegramUser | null> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    params.delete("hash");

    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();

    const dataCheckString = dataCheckArr.join("\n");

    const secretKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      new TextEncoder().encode(dataCheckString)
    );

    const calculatedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash !== hash) {
      console.error("❌ Telegram hash mismatch");
      return null;
    }

    const userJson = params.get("user");
    if (!userJson) return null;

    return JSON.parse(userJson);
  } catch (e) {
    console.error("❌ Telegram validation error:", e);
    return null;
  }
}

/* ----------------------------- EDGE FUNCTION ---------------------------- */
serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    if (!bodyText) {
      return new Response(
        JSON.stringify({ error: "Empty body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { initData, startParam } = JSON.parse(bodyText);

    if (!initData || typeof initData !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server env not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramUser = await validateTelegramData(initData, botToken);
    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: "Telegram auth failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const email = `tg_${telegramUser.id}@streakfarm.app`;
    const password = `tg_${telegramUser.id}_${botToken.slice(-8)}`;

    // 🔍 check profile
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("telegram_id", telegramUser.id)
      .single();

    let userId: string;
    let profileId: string;

    if (existingProfile) {
      userId = existingProfile.user_id;
      profileId = existingProfile.id;
    } else {
      // ➕ create auth user
      const { data: authUser, error } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
          },
        });

      if (error || !authUser.user) {
        throw new Error("User creation failed");
      }

      userId = authUser.user.id;

      const { data: profile } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          telegram_id: telegramUser.id,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name ?? null,
          avatar_url: telegramUser.photo_url ?? null,
          language_code: telegramUser.language_code ?? "en",
        })
        .select("id")
        .single();

      if (!profile) throw new Error("Profile creation failed");

      profileId = profile.id;

      await supabase.from("leaderboards").insert({ user_id: profileId });

      // 🎁 referral
      if (startParam) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("ref_code", startParam)
          .single();

        if (referrer && referrer.id !== profileId) {
          await supabase
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", profileId);

          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referee_id: profileId,
            referrer_bonus: 100,
            referee_bonus: 50,
          });
        }
      }
    }

    // 🔐 sign in
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError || !sessionData.session) {
      throw new Error("Sign in failed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        profile_id: profileId,
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ telegram-auth error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
