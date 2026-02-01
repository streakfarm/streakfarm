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

    // Get user profile - use id (which is the user_id in auth)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, wallet_address, raw_points")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if wallet already connected
    if (profile.wallet_address) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Wallet already connected",
          wallet_address: profile.wallet_address,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a wallet badge
    const { data: existingBadge } = await supabaseAdmin
      .from("user_badges")
      .select("id")
      .eq("user_id", profile.id)
      .eq("badge_id", "ton-holder")
      .maybeSingle();

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
      .maybeSingle();

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
        .maybeSingle();

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
      .eq("key", "wallet_connect_bonus")
      .maybeSingle();

    if (config?.value) {
      walletBonus = parseInt(config.value as string) || 2000;
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
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add to points ledger
    const { error: ledgerError } = await supabaseAdmin
      .from("points_ledger")
      .insert({
        user_id: profile.id,
        amount: walletBonus,
        balance_after: newPoints,
        source: "wallet_connect",
        description: "Bonus for connecting TON wallet",
      });

    if (ledgerError) {
      console.error("Error adding to ledger:", ledgerError);
    }

    // Log event
    const { error: eventError } = await supabaseAdmin
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

    if (eventError) {
      console.error("Error logging event:", eventError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        badge_id: "ton-holder",
        badge_name: badge?.name || "TON Holder",
        points_awarded: walletBonus,
        wallet_address: walletAddress,
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
