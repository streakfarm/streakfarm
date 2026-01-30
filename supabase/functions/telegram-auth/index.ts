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
  photo_url?: string;
}

async function validateTelegramData(initData: string, botToken: string): Promise<{ user: TelegramUser | null; startParam?: string }> {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const startParam = params.get("start_param") || undefined;
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

    if (calculatedHash !== hash) return { user: null };

    const userJson = params.get("user");
    return { user: userJson ? JSON.parse(userJson) : null, startParam };
  } catch (e) {
    console.error("Validation error:", e);
    return { user: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { initData } = await req.json();
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!botToken || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Server configuration missing");
    }

    // 1. Validate Telegram data
    const { user: tgUser, startParam } = await validateTelegramData(initData, botToken);
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
        user_metadata: { 
          telegram_id: tgUser.id, 
          username: tgUser.username,
          first_name: tgUser.first_name,
          photo_url: tgUser.photo_url
        }
      });
      if (createError) throw createError;
      user = newUser;
    }

    // 3. Ensure Profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Generate unique ref_code
      const refCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: user.id,
          telegram_id: tgUser.id,
          username: tgUser.username || `user_${tgUser.id}`,
          first_name: tgUser.first_name,
          avatar_url: tgUser.photo_url,
          ref_code: refCode,
        })
        .select()
        .single();

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw profileError;
      }

      // 4. Handle Referral if startParam exists and it's a new user
      if (isNewUser && startParam && startParam.length === 8) {
        console.log("Processing referral with code:", startParam);
        
        // Find referrer by ref_code
        const { data: referrer } = await supabaseAdmin
          .from('profiles')
          .select('id, user_id, total_referrals, raw_points')
          .eq('ref_code', startParam.toUpperCase())
          .maybeSingle();

        if (referrer && referrer.user_id !== user.id) {
          // Get referral bonuses from config
          const { data: config } = await supabaseAdmin
            .from('admin_config')
            .select('value')
            .eq('id', 'referral_bonuses')
            .maybeSingle();

          const bonuses = config?.value || { referrer: 1000, referee: 500 };
          const referrerBonus = bonuses.referrer || 1000;
          const refereeBonus = bonuses.referee || 500;

          // Create referral record
          const { error: referralError } = await supabaseAdmin
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referee_id: newProfile.id,
              referrer_bonus: referrerBonus,
              referee_bonus: refereeBonus,
              is_valid: true,
            });

          if (referralError) {
            console.error("Referral creation error:", referralError);
          } else {
            // Update referrer's total_referrals and points
            await supabaseAdmin
              .from('profiles')
              .update({
                total_referrals: (referrer.total_referrals || 0) + 1,
                raw_points: (referrer.raw_points || 0) + referrerBonus,
              })
              .eq('id', referrer.id);

            // Add points ledger entry for referrer
            await supabaseAdmin
              .from('points_ledger')
              .insert({
                user_id: referrer.id,
                amount: referrerBonus,
                balance_after: (referrer.raw_points || 0) + referrerBonus,
                source: 'referral',
                description: `Referral bonus - new user joined`,
              });

            // Update referee's points (welcome bonus)
            await supabaseAdmin
              .from('profiles')
              .update({
                raw_points: refereeBonus,
                referred_by: referrer.id,
              })
              .eq('id', newProfile.id);

            // Add points ledger entry for referee
            await supabaseAdmin
              .from('points_ledger')
              .insert({
                user_id: newProfile.id,
                amount: refereeBonus,
                balance_after: refereeBonus,
                source: 'referral_bonus',
                description: `Welcome bonus - joined via referral`,
              });

            // Log events
            await supabaseAdmin
              .from('events')
              .insert({
                user_id: referrer.id,
                event_type: 'referral_completed',
                event_data: {
                  referee_id: newProfile.id,
                  referee_telegram_id: tgUser.id,
                  points_awarded: referrerBonus,
                },
              });

            console.log("Referral processed successfully:", {
              referrer: referrer.id,
              referee: newProfile.id,
              referrerBonus,
              refereeBonus,
            });
          }
        }
      }
    } else {
      // Update profile with latest Telegram info
      await supabaseAdmin
        .from('profiles')
        .update({
          first_name: tgUser.first_name,
          username: tgUser.username || existingProfile.username,
          avatar_url: tgUser.photo_url || existingProfile.avatar_url,
          last_active_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // 5. Login
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (sessionError) throw sessionError;

    return new Response(JSON.stringify({
      ...sessionData,
      is_new_user: isNewUser,
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
