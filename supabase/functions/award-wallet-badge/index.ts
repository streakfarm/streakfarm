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
      .select("id, wallet_address, raw_points, wallet_connected_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if wallet was already connected (prevent duplicate rewards)
    if (profile.wallet_connected_at) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Wallet already connected - reward already awarded" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has the wallet_connected badge
    const { data: existingBadge } = await supabaseAdmin
      .from("user_badges")
      .select("id")
      .eq("user_id", profile.id)
      .eq("badge_id", "wallet_connected")
      .maybeSingle();

    let badgeAwarded = false;
    let badgeName = "";

    // Award badge if not already awarded
    if (!existingBadge) {
      // Get the wallet_connected badge
      const { data: badge } = await supabaseAdmin
        .from("badges")
        .select("*")
        .eq("id", "wallet_connected")
        .maybeSingle();

      if (badge) {
        const { error: awardError } = await supabaseAdmin
          .from("user_badges")
          .insert({
            user_id: profile.id,
            badge_id: "wallet_connected",
            earned_at: new Date().toISOString(),
            is_active: true,
          });

        if (!awardError) {
          badgeAwarded = true;
          badgeName = badge.name;
        }
      }
    }

    // Get wallet connect bonus from config (default: 5000 points)
    let walletBonus = 5000;
    const { data: config } = await supabaseAdmin
      .from("admin_config")
      .select("value")
      .eq("id", "referral_bonuses")
      .maybeSingle();

    if (config?.value?.wallet_connect) {
      walletBonus = config.value.wallet_connect;
    }

    // Update profile with wallet info, bonus points, and wallet_connected_at
    const newPoints = (profile.raw_points || 0) + walletBonus;
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        wallet_type: "ton",
        wallet_connected_at: new Date().toISOString(),
        raw_points: newPoints,
        last_active_at: new Date().toISOString(),
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

    // Complete the 'connect_wallet' task if exists
    const { data: walletTask } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", "connect_wallet")
      .eq("status", "active")
      .maybeSingle();

    if (walletTask) {
      // Check if already completed
      const { data: existingCompletion } = await supabaseAdmin
        .from("task_completions")
        .select("id")
        .eq("user_id", profile.id)
        .eq("task_id", "connect_wallet")
        .maybeSingle();

      if (!existingCompletion) {
        // Calculate points with multiplier
        const { data: multiplier } = await supabaseAdmin
          .rpc("calculate_user_multiplier", { _profile_id: profile.id });

        const effectiveMultiplier = multiplier || 1;
        const taskPoints = Math.floor(walletTask.points_reward * effectiveMultiplier);

        await supabaseAdmin
          .from("task_completions")
          .insert({
            user_id: profile.id,
            task_id: "connect_wallet",
            points_awarded: taskPoints,
            is_verified: true,
            verification_data: { wallet_address: walletAddress },
          });

        // Update profile points from task
        await supabaseAdmin
          .from("profiles")
          .update({
            raw_points: newPoints + taskPoints,
            total_tasks_completed: 1,
          })
          .eq("id", profile.id);

        // Add task points to ledger
        await supabaseAdmin
          .from("points_ledger")
          .insert({
            user_id: profile.id,
            amount: taskPoints,
            balance_after: newPoints + taskPoints,
            source: "task",
            source_id: "connect_wallet",
            description: `Completed task: ${walletTask.title}`,
          });
      }
    }

    // Log event
    await supabaseAdmin
      .from("events")
      .insert({
        user_id: profile.id,
        event_type: "wallet_connected",
        event_data: {
          wallet_address: walletAddress,
          badge_awarded: badgeAwarded ? "wallet_connected" : null,
          points_awarded: walletBonus,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        badge_awarded: badgeAwarded,
        badge_id: badgeAwarded ? "wallet_connected" : null,
        badge_name: badgeName,
        points_awarded: walletBonus,
        new_balance: newPoints,
        message: badgeAwarded 
          ? "Wallet connected! Badge and bonus points awarded!" 
          : "Wallet connected! Bonus points awarded!",
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
