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
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create authenticated client to verify user
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Get box ID from request
    const { boxId } = await req.json();
    if (!boxId || typeof boxId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid boxId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, raw_points, total_boxes_opened")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the box and validate ownership
    const { data: box, error: boxError } = await supabaseAdmin
      .from("boxes")
      .select("*")
      .eq("id", boxId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (boxError || !box) {
      return new Response(
        JSON.stringify({ error: "Box not found or not owned by user" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate box hasn't been opened
    if (box.opened_at) {
      return new Response(
        JSON.stringify({ error: "Box has already been opened" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate box hasn't expired
    if (box.is_expired || new Date(box.expires_at) < new Date()) {
      // Mark as expired if not already
      if (!box.is_expired) {
        await supabaseAdmin
          .from("boxes")
          .update({ is_expired: true })
          .eq("id", boxId);
      }
      return new Response(
        JSON.stringify({ error: "Box has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate multiplier server-side using the RPC
    const { data: multiplier, error: multiplierError } = await supabaseAdmin
      .rpc("calculate_user_multiplier", { _profile_id: profile.id });

    const effectiveMultiplier = multiplierError ? 1 : (multiplier || 1);

    // Calculate final points
    const finalPoints = Math.floor(box.base_points * effectiveMultiplier);
    const newRawPoints = (profile.raw_points || 0) + finalPoints;
    const newTotalBoxesOpened = (profile.total_boxes_opened || 0) + 1;

    // Perform all updates atomically
    const now = new Date().toISOString();

    // Update box
    const { error: updateBoxError } = await supabaseAdmin
      .from("boxes")
      .update({
        opened_at: now,
        multiplier_applied: effectiveMultiplier,
        final_points: finalPoints,
      })
      .eq("id", boxId)
      .eq("opened_at", null); // Extra safety check

    if (updateBoxError) {
      console.error("Error updating box:", updateBoxError);
      return new Response(
        JSON.stringify({ error: "Failed to open box" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        raw_points: newRawPoints,
        total_boxes_opened: newTotalBoxesOpened,
      })
      .eq("id", profile.id);

    if (updateProfileError) {
      console.error("Error updating profile:", updateProfileError);
    }

    // Create points ledger entry
    const { error: ledgerError } = await supabaseAdmin
      .from("points_ledger")
      .insert({
        user_id: profile.id,
        amount: finalPoints,
        balance_after: newRawPoints,
        source: "box",
        source_id: boxId,
        description: `Opened ${box.rarity} box`,
      });

    if (ledgerError) {
      console.error("Error creating ledger entry:", ledgerError);
    }

    // Log event
    await supabaseAdmin
      .from("events")
      .insert({
        user_id: profile.id,
        event_type: "box_opened",
        event_data: {
          box_id: boxId,
          rarity: box.rarity,
          base_points: box.base_points,
          multiplier: effectiveMultiplier,
          final_points: finalPoints,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        box: {
          id: boxId,
          rarity: box.rarity,
          base_points: box.base_points,
          multiplier_applied: effectiveMultiplier,
          final_points: finalPoints,
        },
        new_balance: newRawPoints,
        total_boxes_opened: newTotalBoxesOpened,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in open-box:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
