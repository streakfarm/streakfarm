import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function validateTelegramData(
  initData: string,
  botToken: string
): Promise<{ valid: boolean; user: any | null; debug: string }> {
  try {
    // URL decode if needed
    const decodedData = decodeURIComponent(initData);
    
    const params = new URLSearchParams(decodedData);
    const hash = params.get("hash");
    
    if (!hash) {
      return { valid: false, user: null, debug: "No hash param found" };
    }

    params.delete("hash");

    // Sort alphabetically (CRITICAL!)
    const keys = Array.from(params.keys()).sort();
    const dataCheckArr = keys.map((key) => {
      const value = params.get(key);
      return `${key}=${value}`;
    });

    const dataCheckString = dataCheckArr.join("\n");
    console.log("Data check string:", dataCheckString);
    console.log("Received hash:", hash);

    const encoder = new TextEncoder();

    // Step 1: Create secret key from bot token (HMAC-SHA256)
    const botTokenKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(botToken),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Step 2: Sign "WebAppData" with bot token key
    const secretKeyBuffer = await crypto.subtle.sign(
      "HMAC",
      botTokenKey,
      encoder.encode("WebAppData")
    );

    // Step 3: Import the resulting key
    const secretKey = await crypto.subtle.importKey(
      "raw",
      secretKeyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Step 4: Sign the data check string
    const signature = await crypto.subtle.sign(
      "HMAC",
      secretKey,
      encoder.encode(dataCheckString)
    );

    // Convert to hex
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("Calculated hash:", calculatedHash);
    console.log("Hashes match:", calculatedHash === hash);

    if (calculatedHash !== hash) {
      return { 
        valid: false, 
        user: null, 
        debug: `Hash mismatch. Expected: ${calculatedHash}, Got: ${hash}` 
      };
    }

    const userJson = params.get("user");
    if (!userJson) {
      return { valid: false, user: null, debug: "No user data" };
    }

    return { valid: true, user: JSON.parse(userJson), debug: "Success" };
  } catch (e) {
    console.error("Validation error:", e);
    return { valid: false, user: null, debug: `Exception: ${e.message}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    console.log("Request received:", new Date().toISOString());
    
    const bodyText = await req.text();
    console.log("Body received:", bodyText.substring(0, 200));

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
      console.error("Missing env vars");
      return new Response(
        JSON.stringify({ error: "Server configuration error", debug: { 
          hasBotToken: !!botToken, 
          hasUrl: !!supabaseUrl, 
          hasKey: !!serviceRoleKey 
        }}),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate with detailed debugging
    const validation = await validateTelegramData(initData, botToken);
    
    if (!validation.valid) {
      console.error("Validation failed:", validation.debug);
      return new Response(
        JSON.stringify({ 
          error: "Telegram auth failed", 
          debug: validation.debug,
          hint: "Check bot token and initData format"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telegramUser = validation.user;
    console.log("User validated:", telegramUser.id);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    const email = `tg_${telegramUser.id}@streakfarm.app`;
    const password = `tg_${telegramUser.id}_${botToken.slice(-8)}`;

    // Check existing user
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
      console.log("Existing user:", userId);
    } else {
      console.log("Creating new user...");
      
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
        },
      });

      if (createError || !authUser.user) {
        console.error("Create user error:", createError);
        throw new Error(`User creation failed: ${createError?.message}`);
      }

      userId = authUser.user.id;
      console.log("Created user:", userId);

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
        throw new Error("Profile creation failed");
      }

      profileId = profile.id;
      
      // Insert to leaderboard
      await supabase.from("leaderboards").insert({ user_id: profileId });

      // Handle referral
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

    // Sign in
    console.log("Signing in user:", userId);
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.session) {
      console.error("Sign in error:", signInError);
      throw new Error("Sign in failed");
    }

    console.log("Auth successful");

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        profile_id: profileId || existingProfile?.id,
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
