import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

async function validateTelegramData(initData: string, botToken: string): Promise<TelegramUser | null> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");

    const dataCheckArr: string[] = [];
    params.forEach((value, key) => dataCheckArr.push(`${key}=${value}`));
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    const encoder = new TextEncoder();
    
    // 1. Create secret key
    const secretKeyData = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secretKey = await crypto.subtle.sign("HMAC", secretKeyData, encoder.encode(botToken));

    // 2. Sign data check string
    const signatureKeyData = await crypto.subtle.importKey(
      "raw",
      secretKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", signatureKeyData, encoder.encode(dataCheckString));
    
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHash !== hash) return null;

    const userJson = params.get("user");
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { initData } = await req.json();
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !serviceRoleKey) throw new Error("Server configuration missing");

    // 1. Validate
    const tgUser = await validateTelegramData(initData, botToken);
    if (!tgUser) {
      return new Response(JSON.stringify({ error: "Invalid Telegram data" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const email = `tg_${tgUser.id}@telegram.user`;
    const password = `tg_pass_${tgUser.id}_${botToken.substring(0, 10)}`;

    // 2. Check/Create User
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: tgUser.id, username: tgUser.username }
      });
      if (createError) throw createError;
      user = newUser;
    }

    // 3. Ensure Profile
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      username: tgUser.username || `user_${tgUser.id}`,
      full_name: `${tgUser.first_name} ${tgUser.last_name || ""}`.trim(),
    });

    // 4. Login
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (sessionError) throw sessionError;

    return new Response(JSON.stringify(sessionData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
