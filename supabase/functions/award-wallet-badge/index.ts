import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "Wallet address required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, wallet_address, raw_points")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a wallet badge
    const { data: existingBadge } = await supabaseAdmin
      .from("user_badges")
      .select("id")
      .eq("user_id", profile.id)
      .eq("badge_id", "ton-holder")
      .single();

    if (existingBadge) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Wallet badge already awarded" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the TON Holder badge (or create if doesn't exist)
    let { data: badge } = await supabaseAdmin
      .from("badges")
      .select("*")
      .eq("id", "ton-holder")
      .single();

    if (!badge) {
      // Create the wallet badge if it doesn't exist
      const { data: newBadge, error: createError } = await supabaseAdmin
        .from("badges")
        .insert({
          id: "ton-holder",
          name: "TON Holder",
          description: "Connected a TON wallet to StreakFarm",
          icon_emoji: "💎",
          badge_category: "wallet",
          rarity: "rare",
          multiplier: 1.1,
          is_active: true,
          can_convert_to_nft: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating badge:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create badge" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      badge = newBadge;
    }

    // Award the badge to user
    const { error: awardError } = await supabaseAdmin
      .from("user_badges")
      .insert({
        user_id: profile.id,
        badge_id: "ton-holder",
        earned_at: new Date().toISOString(),
        is_active: true,
      });

    if (awardError) {
      console.error("Error awarding badge:", awardError);
      return new Response(
        JSON.stringify({ error: "Failed to award badge" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get wallet connect bonus from config
    let walletBonus = 2000;
    const { data: config } = await supabaseAdmin
      .from("admin_config")
      .select("value")
      .eq("id", "game_config")
      .single();

    if (config?.value) {
      const gameConfig = config.value as Record<string, unknown>;
      walletBonus = (gameConfig.wallet_connect_bonus as number) || 2000;
    }

    // Update profile with wallet info and bonus points
    const newPoints = (profile.raw_points || 0) + walletBonus;
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        wallet_type: "ton",
        wallet_connected_at: new Date().toISOString(),
        raw_points: newPoints,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    // Add to points ledger
    await supabaseAdmin
      .from("points_ledger")
      .insert({
        user_id: profile.id,
        amount: walletBonus,
        balance_after: newPoints,
        source: "wallet_connect",
        description: "Bonus for connecting TON wallet",
      });

    // Log event
    await supabaseAdmin
      .from("events")
      .insert({
        user_id: profile.id,
        event_type: "wallet_connected",
        event_data: {
          wallet_address: walletAddress,
          badge_awarded: "ton-holder",
          points_awarded: walletBonus,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        badge_id: "ton-holder",
        badge_name: badge.name,
        points_awarded: walletBonus,
        message: "Wallet badge awarded successfully!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in award-wallet-badge:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
