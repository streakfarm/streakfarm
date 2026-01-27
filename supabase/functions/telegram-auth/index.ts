import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  console.log("🔥 FUNCTION STARTED");
  
  try {
    const bodyText = await req.text();
    console.log("📦 Raw body:", bodyText.substring(0, 300));
    
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON", raw: bodyText.substring(0, 100) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { initData, startParam } = body;
    
    if (!initData) {
      return new Response(
        JSON.stringify({ error: "Missing initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    
    console.log("🔑 Bot token exists:", !!botToken);
    
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔥 TEMPORARY: Skip validation for testing
    // Agar validation fail ho raha hai, toh temporarily yeh use karo:
    const SKIP_VALIDATION = false; // <-- Isko true karo testing ke liye
    
    let telegramUser;
    
    if (SKIP_VALIDATION) {
      console.log("⚠️ SKIPPING VALIDATION - TEST MODE");
      // Parse user from initData without validation
      const params = new URLSearchParams(initData);
      const userStr = params.get("user");
      telegramUser = userStr ? JSON.parse(userStr) : { id: 123456, first_name: "Test" };
    } else {
      // 🔐 Proper validation
      const encoder = new TextEncoder();
      
      // Parse initData
      const params = new URLSearchParams(initData);
      const hash = params.get("hash");
      
      if (!hash) {
        return new Response(
          JSON.stringify({ error: "No hash in initData" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      params.delete("hash");
      
      // Build data check string (CRITICAL: alphabetically sorted)
      const keys = Array.from(params.keys()).sort();
      const dataCheckArr = keys.map(key => `${key}=${params.get(key)}`);
      const dataCheckString = dataCheckArr.join("\n");
      
      console.log("📝 Data string:", dataCheckString.substring(0, 200));
      console.log("🔐 Received hash:", hash);
      
      try {
        // HMAC-SHA256(botToken, "WebAppData") = secret
        const botKey = await crypto.subtle.importKey(
          "raw",
          encoder.encode(botToken),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        
        const secretBuffer = await crypto.subtle.sign(
          "HMAC",
          botKey,
          encoder.encode("WebAppData")
        );
        
        const secretKey = await crypto.subtle.importKey(
          "raw",
          secretBuffer,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        
        // HMAC-SHA256(secret, dataCheckString) = hash
        const sig = await crypto.subtle.sign(
          "HMAC",
          secretKey,
          encoder.encode(dataCheckString)
        );
        
        const calculatedHash = Array.from(new Uint8Array(sig))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
        
        console.log("🧮 Calculated:", calculatedHash);
        console.log("✅ Match:", calculatedHash === hash);
        
        if (calculatedHash !== hash) {
          return new Response(
            JSON.stringify({ 
              error: "Invalid hash", 
              debug: "Hash mismatch" 
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const userStr = params.get("user");
        if (!userStr) throw new Error("No user data");
        telegramUser = JSON.parse(userStr);
        
      } catch (cryptoErr) {
        console.error("❌ Crypto error:", cryptoErr);
        return new Response(
          JSON.stringify({ error: "Validation error", details: cryptoErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("✅ User validated:", telegramUser.id);
    
    // Rest of your code (Supabase auth)...
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase not configured" }),
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
      .single();

    let userId, profileId;

    if (existing) {
      userId = existing.user_id;
      profileId = existing.id;
      console.log("👤 Existing user");
    } else {
      console.log("➕ Creating user...");
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username 
        }
      });

      if (createErr || !newUser.user) {
        console.error("❌ Create error:", createErr);
        throw new Error("Failed to create user");
      }
      
      userId = newUser.user.id;
      
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          telegram_id: telegramUser.id,
          username: telegramUser.username ?? null,
          first_name: telegramUser.first_name ?? null,
          avatar_url: telegramUser.photo_url ?? null,
          language_code: telegramUser.language_code ?? "en"
        })
        .select("id")
        .single();
        
      if (profileErr || !profile) throw new Error("Profile creation failed");
      profileId = profile.id;
      
      // Referral logic...
      if (startParam) {
        const { data: ref } = await supabase.from("profiles").select("id").eq("ref_code", startParam).single();
        if (ref) {
          await supabase.from("profiles").update({ referred_by: ref.id }).eq("id", profileId);
          await supabase.from("referrals").insert({
            referrer_id: ref.id,
            referee_id: profileId,
            referrer_bonus: 100,
            referee_bonus: 50
          });
        }
      }
    }

    // Sign in
    console.log("🔐 Signing in...");
    const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInErr || !session.session) {
      console.error("❌ Sign in error:", signInErr);
      throw new Error("Sign in failed");
    }

    console.log("🎉 SUCCESS");
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        profile_id: profileId,
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("💥 FATAL ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
