import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

function validateTelegramData(initData: string, botToken: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;

    // Remove hash from params for verification
    params.delete("hash");

    // Sort params alphabetically and create data check string
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    // Correct: Key is botToken, Data is "WebAppData"
const secretKey = createHmac("sha256", botToken).update("WebAppData").digest();

    
    // Calculate hash
    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      console.error("Hash mismatch:", { calculated: calculatedHash, received: hash });
      return null;
    }

    // Parse user data
    const userJson = params.get("user");
    if (!userJson) return null;

    return JSON.parse(userJson) as TelegramUser;
  } catch (error) {
    console.error("Error validating Telegram data:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  console.log("DEBUG: telegram-auth function called");
  console.log("DEBUG: Method:", req.method);
  console.log("DEBUG: Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
      console.log("DEBUG: Body received successfully");
    } catch (e) {
      console.error("DEBUG: Failed to parse JSON body:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { initData, startParam } = body;
    console.log("DEBUG: initData length:", initData?.length || 0);
    console.log("DEBUG: startParam:", startParam || "none");

    if (!initData || typeof initData !== "string") {
      console.error("Missing or invalid initData");
      return new Response(
        JSON.stringify({ error: "Missing or invalid initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("DEBUG: Env Check - BOT_TOKEN:", botToken ? "EXISTS (starts with " + botToken.substring(0, 4) + ")" : "MISSING");
    console.log("DEBUG: Env Check - SUPABASE_URL:", supabaseUrl ? "EXISTS" : "MISSING");
    console.log("DEBUG: Env Check - SERVICE_ROLE_KEY:", serviceRoleKey ? "EXISTS" : "MISSING");
    
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured - available env keys:", Object.keys(Deno.env.toObject()).filter(k => !k.includes("KEY") && !k.includes("TOKEN") && !k.includes("SECRET")));
      return new Response(
        JSON.stringify({ error: "Server configuration error", detail: "BOT_TOKEN missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error", detail: "Supabase config missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Telegram data
    const telegramUser = validateTelegramData(initData, botToken);
    if (!telegramUser) {
      return new Response(
        JSON.stringify({ error: "Invalid Telegram authentication data" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user exists by telegram_id
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id")
      .eq("telegram_id", telegramUser.id)
      .single();

    let userId: string;
    let profileId: string;
    const email = `tg_${telegramUser.id}@streakfarm.app`;
    const password = `tg_${telegramUser.id}_${botToken.slice(-8)}`;

    if (existingProfile) {
      // User exists, sign them in
      userId = existingProfile.user_id;
      profileId = existingProfile.id;

      // Update profile with latest Telegram data
      await supabaseAdmin
        .from("profiles")
        .update({
          username: telegramUser.username || null,
          first_name: telegramUser.first_name || null,
          avatar_url: telegramUser.photo_url || null,
          language_code: telegramUser.language_code || "en",
          last_active_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      // Sign in the user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        // If sign in fails, try to update the password
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        
        // Try again
        const { data: retryData, error: retryError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (retryError) {
          console.error("Retry sign in failed:", retryError);
          return new Response(
            JSON.stringify({ error: "Authentication failed" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            user_id: userId,
            profile_id: profileId,
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            access_token: retryData.session?.access_token,
            refresh_token: retryData.session?.refresh_token,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          profile_id: profileId,
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          access_token: signInData.session?.access_token,
          refresh_token: signInData.session?.refresh_token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create new user
      const { data: authUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
        },
      });

      if (signUpError || !authUser.user) {
        console.error("Error creating user:", signUpError);
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authUser.user.id;

      // Check if profile already exists (might have been created by trigger)
      const { data: existingProfileForUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingProfileForUser) {
        // Update existing profile
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            telegram_id: telegramUser.id,
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || null,
            avatar_url: telegramUser.photo_url || null,
            language_code: telegramUser.language_code || "en",
          })
          .eq("user_id", userId)
          .select("id")
          .single();

        if (updateError) {
          console.error("Error updating profile:", updateError);
        }
        profileId = existingProfileForUser.id;
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: userId,
            telegram_id: telegramUser.id,
            username: telegramUser.username || null,
            first_name: telegramUser.first_name || null,
            avatar_url: telegramUser.photo_url || null,
            language_code: telegramUser.language_code || "en",
          })
          .select("id")
          .single();

        if (profileError || !newProfile) {
          console.error("Error creating profile:", profileError);
          return new Response(
            JSON.stringify({ error: "Failed to create profile" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        profileId = newProfile.id;

        // Create initial leaderboard entry
        await supabaseAdmin
          .from("leaderboards")
          .insert({ user_id: profileId });
      }

      // Handle referral if startParam is provided
      if (startParam) {
        const { data: referrer } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("ref_code", startParam)
          .single();

        if (referrer && referrer.id !== profileId) {
          // Update referred_by
          await supabaseAdmin
            .from("profiles")
            .update({ referred_by: referrer.id })
            .eq("id", profileId);

          // Create referral entry
          await supabaseAdmin
            .from("referrals")
            .insert({
              referrer_id: referrer.id,
              referee_id: profileId,
              referrer_bonus: 100,
              referee_bonus: 50,
            });

          // Update referrer's total_referrals
          const { data: referrerProfile } = await supabaseAdmin
            .from("profiles")
            .select("total_referrals")
            .eq("id", referrer.id)
            .single();

          if (referrerProfile) {
            await supabaseAdmin
              .from("profiles")
              .update({ total_referrals: (referrerProfile.total_referrals || 0) + 1 })
              .eq("id", referrer.id);
          }
        }
      }

      // Sign in the new user
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Sign in error for new user:", signInError);
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          profile_id: profileId,
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          is_new_user: true,
          access_token: signInData.session?.access_token,
          refresh_token: signInData.session?.refresh_token,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in telegram-auth:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
