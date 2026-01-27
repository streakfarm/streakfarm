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
    const bodyText = await req.text();
    if (!bodyText) {
      return new Response(
        JSON.stringify({ error: "Empty body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { initData, startParam } = JSON.parse(bodyText);
    
    if (!initData) {
      return new Response(
        JSON.stringify({ error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse user from initData (NO VALIDATION)
    const params = new URLSearchParams(initData);
    const userStr = params.get("user");
    
    if (!userStr) {
      return new Response(
        JSON.stringify({ error: "No user data in initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let telegramUser;
    try {
      telegramUser = JSON.parse(userStr);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid user data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing user:", telegramUser.id, telegramUser.first_name);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const email = `tg_${telegramUser.id}@streakfarm.app`;
    const password = `tg_${telegramUser.id}_${botToken.slice(-8)}`;

    // Check if user exists
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
      console.log("Existing user found");
    } else {
      console.log("Creating new user...");
      
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username,
        },
      });

      if (createError || !authUser.user) {
        console.error("Create user error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user", details: createError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authUser.user.id;
      console.log("User created:", userId);

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
        console.error("Profile error:", profileError);
        return new Response(
          JSON.stringify({ error: "Profile creation failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      profileId = profile.id;
      console.log("Profile created:", profileId);

      // Leaderboard
      await supabase.from("leaderboards").insert({ user_id: profileId });

      // Referral
      if (startParam) {
        const { data: referrer } = await supabase
          .from("profiles")
          .select("id")
          .eq("ref_code", startParam)
          .maybeSingle();

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

    // Sign in
    console.log("Signing in...");
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !session.session) {
      console.error("Sign in error:", signInError);
      return new Response(
        JSON.stringify({ error: "Sign in failed", details: signInError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth successful");

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        profile_id: profileId,
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Fatal error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
