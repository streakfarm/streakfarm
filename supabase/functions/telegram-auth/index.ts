import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();

    if (!initData || !initData.includes("hash=")) {
      return new Response(JSON.stringify({ error: "Invalid initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing environment variables");
    }

    // Validate Telegram data
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");

    const dataCheckArr: string[] = [];
    params.forEach((v, k) => dataCheckArr.push(`${k}=${v}`));
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    const encoder = new TextEncoder();
    const secretKeyData = await crypto.subtle.importKey(
      "raw", encoder.encode("WebAppData"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const secretKey = await crypto.subtle.sign("HMAC", secretKeyData, encoder.encode(botToken));
    const signatureKeyData = await crypto.subtle.importKey(
      "raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", signatureKeyData, encoder.encode(dataCheckString));
    const calculatedHash = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (calculatedHash !== hash) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userJson = params.get("user");
    if (!userJson) {
      return new Response(JSON.stringify({ error: "No user data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tgUser = JSON.parse(userJson);
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create/get auth user
    const email = `tg_${tgUser.id}@telegram.user`;
    const password = `tg_pass_${tgUser.id}_${botToken.slice(0, 10)}`;

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
      const { data: { user: newUser } } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: tgUser.id, username: tgUser.username },
      });
      user = newUser;
    }

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Create/update profile using service role (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: user.id,
        telegram_id: tgUser.id,
        username: tgUser.username || `user_${tgUser.id}`,
        first_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
        avatar_url: tgUser.photo_url || null,
        language_code: tgUser.language_code || 'en',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Sign in
    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.session) {
      throw new Error(signInError?.message || "Sign in failed");
    }

    return new Response(JSON.stringify({
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Auth error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
