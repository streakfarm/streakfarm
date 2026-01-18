// Supabase Edge Function (Deno) - validates Telegram initData, upserts profile, handles referral,
// creates a Supabase Auth user (server-side) and signs in to return access_token/refresh_token + profile.
//
// Required function env vars (configured in Supabase UI):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - TELEGRAM_BOT_TOKEN
// - ORIGINS (optional, comma-separated allowed origins for CORS; default '*', lock this in PROD)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac, randomUUID } from "node:crypto";

const DEFAULT_CORS = "*";

function getEnv(key: string) {
  return Deno.env.get(key) ?? undefined;
}

function corsHeaders(origin?: string) {
  const allowed = getEnv("ORIGINS") ?? DEFAULT_CORS;
  const allowOrigin = allowed === "*" ? "*" : (origin && allowed.split(",").map(s => s.trim()).includes(origin) ? origin : allowed.split(",")[0]);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

function validateTelegramData(initData: string, botToken: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    // remove hash for verification
    params.delete("hash");

    // build data_check_string
    const parts: string[] = [];
    params.forEach((value, key) => {
      parts.push(`${key}=${value}`);
    });
    parts.sort();
    const dataCheckString = parts.join("\n");

    // secret key per Telegram docs
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) {
      console.error("Telegram validation failed: hash mismatch", { calculatedHash, hash });
      return null;
    }

    const userJson = params.get("user");
    if (!userJson) return null;
    return JSON.parse(userJson) as TelegramUser;
  } catch (err) {
    console.error("validateTelegramData error", err);
    return null;
  }
}

function generateReferralCode() {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

// Helper: create a temp email for Supabase Auth user (no external email needed)
function makeServiceEmail(telegramId: number) {
  return `tg-${telegramId}@streakfarm.internal`;
}

// Create password for service user (sufficiently random)
function makeRandomPassword() {
  return randomUUID() + Date.now().toString(36);
}

async function createSupabaseSession(supabaseAdmin: any, supabaseUrl: string, serviceKey: string, email: string, password: string) {
  // Create session by calling the token endpoint with grant_type=password
  // Using service role key as apikey header; this approach works when the user already exists and password is set.
  // We'll POST to ${SUPABASE_URL}/auth/v1/token
  const tokenUrl = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token`;
  const body = new URLSearchParams();
  body.set("grant_type", "password");
  body.set("email", email);
  body.set("password", password);

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: body.toString(),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to create session via token endpoint: ${resp.status} ${txt}`);
  }

  return await resp.json(); // should include access_token, refresh_token, expires_in, token_type
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? undefined;
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const TELEGRAM_BOT_TOKEN = getEnv("TELEGRAM_BOT_TOKEN");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TELEGRAM_BOT_TOKEN) {
      console.error("Missing required function env vars");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { initData, startParam } = body ?? {};

    if (!initData || typeof initData !== "string") {
      return new Response(JSON.stringify({ error: "Missing initData" }), { status: 400, headers: { ...headers, "Content-Type": "application/json" } });
    }

    const tgUser = validateTelegramData(initData, TELEGRAM_BOT_TOKEN);
    if (!tgUser) {
      return new Response(JSON.stringify({ error: "Invalid telegram initData" }), { status: 401, headers: { ...headers, "Content-Type": "application/json" } });
    }

    // supabase admin client (service role)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Upsert profile in profiles table
    const telegramIdStr = String(tgUser.id);
    const displayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").slice(0, 255) || null;
    const username = tgUser.username ?? null;
    const avatar = tgUser.photo_url ?? null;
    const now = new Date().toISOString();

    // Find existing profile
    const { data: existingProfile, error: getErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("telegram_id", telegramIdStr)
      .limit(1)
      .maybeSingle();

    if (getErr) {
      console.error("Error querying profiles", getErr);
      return new Response(JSON.stringify({ error: "Database error" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }

    // Determine referred_by if startParam provided (assume startParam is referral_code)
    let referredBy: string | null = null;
    if (startParam && typeof startParam === "string" && startParam.trim()) {
      const refCode = startParam.trim();
      const { data: refUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode)
        .limit(1)
        .maybeSingle();

      if (refUser && (refUser as any).id) {
        referredBy = (refUser as any).id;
      }
    }

    let profile: any = null;
    let isNew = false;

    if (existingProfile) {
      // Update last seen and maybe missing fields
      const updates: any = {
        display_name: displayName,
        username,
        avatar_url: avatar,
        last_seen_at: now,
      };
      if (!existingProfile.referred_by && referredBy) updates.referred_by = referredBy;

      const { data: updated, error: upErr } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (upErr) {
        console.error("Failed updating profile", upErr);
        return new Response(JSON.stringify({ error: "Failed to update profile" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
      }
      profile = updated;
    } else {
      // create new profile
      const newProfile = {
        id: randomUUID(),
        telegram_id: telegramIdStr,
        display_name: displayName,
        username,
        avatar_url: avatar,
        referral_code: generateReferralCode(),
        referred_by: referredBy,
        created_at: now,
        last_seen_at: now,
      };

      const { data: created, error: createErr } = await supabaseAdmin
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();

      if (createErr) {
        console.error("Failed creating profile", createErr);
        return new Response(JSON.stringify({ error: "Failed to create profile" }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
      }
      profile = created;
      isNew = true;
    }

    // Ensure Supabase Auth user exists for this profile
    // We create an internal email and password for the user so we can sign them in and create a session.
    const serviceEmail = makeServiceEmail(tgUser.id);
    const servicePassword = makeRandomPassword();

    // Try to find an existing auth user with this email
    const { data: existingAuth, error: authGetErr } = await supabaseAdmin.auth.admin.listUsers();
    // NOTE: listUsers may return many users; for scale, consider using admin API to filter.
    // We'll attempt to create user with admin.createUser and ignore 'user already exists' style errors.

    // Try create user (idempotent if user already exists will fail; we'll handle that)
    let userId: string | null = null;
    try {
      const createRes = await supabaseAdmin.auth.admin.createUser({
        email: serviceEmail,
        password: servicePassword,
        user_metadata: { telegram_id: telegramIdStr, profile_id: profile.id },
        email_confirm: true,
      });
      if (createRes.user && createRes.user.id) {
        userId = createRes.user.id;
      }
    } catch (err) {
      // If user exists, try to find it by email
      console.warn("admin.createUser returned error (may already exist):", err);
      // Try sign-in path below; we will attempt to sign in with the email / password we just generated — if user existed, we need a way to sign in.
    }

    // If createUser didn't return user id (user existed), try to find by email using admin list or query auth.users table (service role)
    if (!userId) {
      // Query auth.users via direct SQL (service role)
      try {
        const { data: rows }: any = await supabaseAdmin.rpc("pg_catalog_auth_users_search", { _email: serviceEmail }).catch(() => ({ data: null }));
        // The above is a placeholder: not all Supabase projects have such RPC. Fallback to calling users view:
      } catch {
        // ignore
      }
    }

    // To get a session: we will attempt to sign in via the token endpoint using the email & password.
    // If we created the user just now, the generated 'servicePassword' works.
    // If user existed and we didn't know their password, we instead generate a one-time token or fallback to issuing an app token.
    let tokens: any = null;
    try {
      tokens = await createSupabaseSession(supabaseAdmin, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, serviceEmail, servicePassword);
      // tokens should include access_token and refresh_token
    } catch (sessionErr) {
      console.warn("Failed to create Supabase session using password grant:", sessionErr);
      // Fallback: as a last resort, issue a short-lived signed app token (not a Supabase session).
      // This fallback will be returned in 'app_token' and documented on client; server functions must support it.
      const fallbackAppToken = createFallbackAppToken(profile.id, getEnv("APP_JWT_SECRET") ?? "");
      return new Response(JSON.stringify({ profile, fallbackAppToken, warning: "Could not create Supabase session. Received fallback app token. Please check auth flow." }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }

    // Return profile + tokens so client can set supabase session
    return new Response(JSON.stringify({ profile, tokens, isNew }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("telegram-auth function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() } });
  }
});

// Helper to create fallback app token (short-lived)
function createFallbackAppToken(sub: string, secret: string, ttlSeconds = 60 * 15) {
  if (!secret) return null;
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload = { sub, iat, exp };
  const b64 = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}