import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

async function validateTelegramData(initData: string, botToken: string): Promise<{ user: TelegramUser | null; isValid: boolean; error?: string }> {
  try {
    console.log("[validateTelegramData] Starting validation, initData length:", initData.length);

    const params = new URLSearchParams(initData);
    const hash = params.get("hash");

    if (!hash) {
      console.error("[validateTelegramData] Missing hash in initData");
      return { user: null, isValid: false, error: "Missing hash parameter" };
    }

    params.delete("hash");

    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    console.log("[validateTelegramData] Data check string length:", dataCheckString.length);

    const encoder = new TextEncoder();

    // Create secret key: HMAC_SHA256("WebAppData", botToken)
    const secretKeyData = await crypto.subtle.importKey(
      "raw",
      encoder.encode("WebAppData"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const secretKey = await crypto.subtle.sign("HMAC", secretKeyData, encoder.encode(botToken));

    // Create signature: HMAC_SHA256(secret_key, data_check_string)
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

    console.log("[validateTelegramData] Hash comparison:", {
      receivedHashLength: hash.length,
      calculatedHashLength: calculatedHash.length,
      match: calculatedHash === hash,
    });

    if (calculatedHash !== hash) {
      console.error("[validateTelegramData] Hash mismatch!");
      return { user: null, isValid: false, error: "Invalid Telegram data signature" };
    }

    // Check auth_date to prevent replay attacks (optional but recommended)
    const authDate = params.get("auth_date");
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 86400; // 24 hours

      if (now - authTimestamp > maxAge) {
        console.error("[validateTelegramData] Auth data too old");
        return { user: null, isValid: false, error: "Authentication data expired" };
      }
    }

    const userJson = params.get("user");
    if (!userJson) {
      console.error("[validateTelegramData] No user data in initData");
      return { user: null, isValid: false, error: "No user data in initData" };
    }

    const user: TelegramUser = JSON.parse(userJson);
    console.log("[validateTelegramData] User validated:", {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
    });

    return { user, isValid: true };
  } catch (e: any) {
    console.error("[validateTelegramData] Validation error:", e.message);
    return { user: null, isValid: false, error: `Validation error: ${e.message}` };
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] DEBUG: Request received - ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] DEBUG: Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[${requestId}] DEBUG: Failed to parse request body:`, e);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { initData } = body;
    console.log(`[${requestId}] DEBUG: initData received:`, initData ? `Length: ${initData.length}` : "EMPTY");

    if (!initData || !initData.trim()) {
      return new Response(JSON.stringify({ error: "Missing initData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate initData format
    if (!initData.includes("hash=") || !initData.includes("user=")) {
      console.error(`[${requestId}] DEBUG: Invalid initData format`);
      return new Response(JSON.stringify({ error: "Invalid initData format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log(`[${requestId}] DEBUG: Environment check:`, {
      hasBotToken: !!botToken,
      botTokenLength: botToken?.length || 0,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
    });

    if (!botToken) {
      throw new Error("Missing TELEGRAM_BOT_TOKEN environment variable");
    }
    if (!supabaseUrl) {
      throw new Error("Missing SUPABASE_URL environment variable");
    }
    if (!serviceRoleKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    // Validate Telegram data
    const validation = await validateTelegramData(initData, botToken);

    if (!validation.isValid || !validation.user) {
      console.error(`[${requestId}] DEBUG: Validation failed:`, validation.error);
      return new Response(JSON.stringify({ error: validation.error || "Invalid Telegram data" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tgUser = validation.user;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Use a deterministic email and password based on Telegram ID
    const email = `tg_${tgUser.id}@telegram.user`;
    const password = `tg_pass_${tgUser.id}_${botToken.substring(0, 10)}`;

    console.log(`[${requestId}] DEBUG: Processing user ${tgUser.id} (${tgUser.username || 'no-username'})`);

    // 1. Check if user exists in auth.users
    let user = null;
    try {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      user = users.find(u => u.email === email);
      console.log(`[${requestId}] DEBUG: User lookup result:`, user ? `Found (ID: ${user.id})` : "Not found");
    } catch (listError: any) {
      console.error(`[${requestId}] DEBUG: Error listing users:`, listError.message);
      throw new Error(`Failed to lookup user: ${listError.message}`);
    }

    // 2. Create user if not exists
    if (!user) {
      console.log(`[${requestId}] DEBUG: Creating new auth user...`);
      try {
        const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            telegram_id: tgUser.id,
            username: tgUser.username,
            full_name: `${tgUser.first_name} ${tgUser.last_name || ""}`.trim(),
          },
        });

        if (createError) {
          console.error(`[${requestId}] DEBUG: Create user error:`, createError.message);
          throw createError;
        }

        user = newUser;
        console.log(`[${requestId}] DEBUG: Created new user:`, user?.id);
      } catch (createError: any) {
        console.error(`[${requestId}] DEBUG: Error creating user:`, createError.message);
        throw new Error(`Failed to create user: ${createError.message}`);
      }
    }

    if (!user) {
      throw new Error("Failed to get or create user");
    }

    // 3. Update the profile with Telegram user data
    const fullName = `${tgUser.first_name} ${tgUser.last_name || ""}`.trim();

    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          telegram_id: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          first_name: fullName,
          avatar_url: tgUser.photo_url || null,
          language_code: tgUser.language_code || 'en',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.warn(`[${requestId}] DEBUG: Profile update warning:`, profileError.message);
        // Don't throw - auth still succeeded, profile update is non-critical
      } else {
        console.log(`[${requestId}] DEBUG: Profile updated successfully for user:`, user.id);
      }
    } catch (profileError: any) {
      console.warn(`[${requestId}] DEBUG: Profile update error (non-critical):`, profileError.message);
    }

    // 4. Sign in to get a session
    console.log(`[${requestId}] DEBUG: Signing in user...`);
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      console.error(`[${requestId}] DEBUG: Sign in error:`, sessionError.message);
      throw sessionError;
    }

    if (!sessionData.session) {
      throw new Error("Failed to create session");
    }

    console.log(`[${requestId}] DEBUG: Auth successful for user:`, user.id);

    // Return session data
    return new Response(JSON.stringify({
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
        expires_in: sessionData.session.expires_in,
      },
      user: {
        id: user.id,
        email: user.email,
        telegram_id: tgUser.id,
        username: tgUser.username,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error(`[${requestId}] DEBUG: Auth Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
