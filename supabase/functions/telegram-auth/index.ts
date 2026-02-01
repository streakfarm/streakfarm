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

// Generate unique referral code
function generateRefCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { initData } = await req.json();
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !serviceRoleKey) throw new Error("Server configuration missing");

    // 1. Validate Telegram data
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
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: tgUser.id, username: tgUser.username }
      });
      if (createError) throw createError;
      user = newUser;
    }

    // 3. Extract referral code from initData
    const params = new URLSearchParams(initData);
    const startParam = params.get("start_param");
    let referrerRefCode: string | null = null;
    
    if (startParam && isNewUser) {
      // User came from a referral link
      referrerRefCode = startParam;
    }

    // 4. Ensure Profile with referral handling
    const refCode = generateRefCode();
    const profileData: any = {
      id: user.id,
      username: tgUser.username || `user_${tgUser.id}`,
      full_name: `${tgUser.first_name} ${tgUser.last_name || ""}`.trim(),
      ref_code: refCode,
      telegram_id: tgUser.id,
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) throw profileError;

    // 5. Handle referral if new user came from referral link
    if (isNewUser && referrerRefCode) {
      try {
        // Find the referrer by ref_code
        const { data: referrer } = await supabaseAdmin
          .from('profiles')
          .select('id, total_referrals, raw_points')
          .eq('ref_code', referrerRefCode)
          .maybeSingle();

        if (referrer) {
          // Award referral bonus to referrer
          const referralBonus = 100;
          const newReferrerPoints = (referrer.raw_points || 0) + referralBonus;
          
          await supabaseAdmin
            .from('profiles')
            .update({
              total_referrals: (referrer.total_referrals || 0) + 1,
              raw_points: newReferrerPoints,
            })
            .eq('id', referrer.id);

          // Add to referrer's points ledger
          await supabaseAdmin
            .from('points_ledger')
            .insert({
              user_id: referrer.id,
              amount: referralBonus,
              balance_after: newReferrerPoints,
              source: 'referral',
              source_id: user.id,
              description: `Referral bonus from new user`,
            });

          // Award referee bonus
          const refereeBonus = 50;
          const { data: newProfile } = await supabaseAdmin
            .from('profiles')
            .select('raw_points')
            .eq('id', user.id)
            .maybeSingle();

          const newRefeePoints = (newProfile?.raw_points || 0) + refereeBonus;
          
          await supabaseAdmin
            .from('profiles')
            .update({
              raw_points: newRefeePoints,
            })
            .eq('id', user.id);

          // Add to referee's points ledger
          await supabaseAdmin
            .from('points_ledger')
            .insert({
              user_id: user.id,
              amount: refereeBonus,
              balance_after: newRefeePoints,
              source: 'referral_bonus',
              source_id: referrer.id,
              description: `Bonus for joining via referral link`,
            });

          // Create referral record
          await supabaseAdmin
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referee_id: user.id,
              referred_at: new Date().toISOString(),
            });
        }
      } catch (refError) {
        console.error("Error processing referral:", refError);
        // Don't fail the auth, just log the error
      }
    }

    // 6. Get updated profile for response
    const { data: finalProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // 7. Login
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (sessionError) throw sessionError;

    // 8. Return session with profile data for instant loading
    return new Response(JSON.stringify({
      ...sessionData,
      profile: finalProfile,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
