import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { initData, startParam } = await req.json();
    
    if (!initData) {
      return new Response(
        JSON.stringify({ error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse initData
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = params.get("auth_date");
    const userStr = params.get("user");
    const queryId = params.get("query_id");
    
    if (!hash) {
      return new Response(
        JSON.stringify({ error: "Missing hash in initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build data check string (alphabetically sorted)
    params.delete("hash");
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    const encoder = new TextEncoder();
    
    // HMAC_SHA256(botToken, "WebAppData") = secret
    const botKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(botToken),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const secret = await crypto.subtle.sign(
      "HMAC",
      botKey,
      encoder.encode("WebAppData")
    );
    
    const secretKey = await crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // HMAC_SHA256(secret, dataCheckString) = hash
    const signature = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(dataCheckString)
    );
    
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash !== hash) {
      console.error("Hash mismatch!");
      console.error("Calculated:", calculatedHash);
      console.error("Received:", hash);
      console.error("Bot token length:", botToken.length);
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid hash",
          debug: "Telegram data validation failed. Check bot token."
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userStr) {
      return new Response(
        JSON.stringify({ error: "No user data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramUser = JSON.parse(userStr);
    console.log("User validated:", telegramUser.id);

    // Supabase setup
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const email = `tg_${telegramUser.id}@streakfarm.app`;
    const password = `tg_${telegramUser.id}_${botToken.slice(-8)}`;

    // Check existing
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("telegram_id", telegramUser.id)
      .maybeSingle();

    let userId: string;
    let profileId: string;

    if (existing) {
      userId = existing.user_id;
      profileId = existing.id;
    } else {
      // Create auth user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username,
        },
      });

      if (createError || !newUser.user) {
        throw new Error(createError?.message || "Failed to create user");
      }

      userId = newUser.user.id;

      // Create profile
      const { data: profile, error: profileError } = await supabase
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

      if (profileError || !profile) {
        throw new Error("Profile creation failed");
      }

      profileId = profile.id;
      
      // Leaderboard
      await supabase.from("leaderboards").insert({ user_id: profileId });

      // Referral
      if (startParam) {
        const { data: ref } = await supabase
          .from("profiles")
          .select("id")
          .eq("ref_code", startParam)
          .maybeSingle();

        if (ref && ref.id !== profileId) {
          await supabase
            .from("profiles")
            .update({ referred_by: ref.id })
            .eq("id", profileId);

          await supabase.from("referrals").insert({
            referrer_id: ref.id,
            referee_id: profileId,
            referrer_bonus: 100,
            referee_bonus: 50,
          });
        }
      }
    }

    // Sign in
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !session.session) {
      throw new Error("Sign in failed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        profile_id: profileId,
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        username: telegramUser.username,
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
