import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHECKIN_POINTS = 50;
const STREAK_BONUS_PER_DAY = 5;
const MAX_STREAK_BONUS = 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, raw_points, streak_current, streak_best, last_checkin")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if already checked in today
    if (profile.last_checkin) {
      const lastCheckin = new Date(profile.last_checkin);
      const lastCheckinDay = new Date(lastCheckin.getFullYear(), lastCheckin.getMonth(), lastCheckin.getDate());
      
      if (lastCheckinDay.getTime() === today.getTime()) {
        return new Response(
          JSON.stringify({ 
            error: "Already checked in today",
            next_checkin: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate streak
    let newStreak = 1;
    let streakMaintained = false;
    
    if (profile.last_checkin) {
      const lastCheckin = new Date(profile.last_checkin);
      const lastCheckinDay = new Date(lastCheckin.getFullYear(), lastCheckin.getMonth(), lastCheckin.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      if (lastCheckinDay.getTime() === yesterday.getTime()) {
        // Consecutive day - increase streak
        newStreak = (profile.streak_current || 0) + 1;
        streakMaintained = true;
      }
      // If more than 1 day gap, streak resets to 1
    }

    const newStreakBest = Math.max(newStreak, profile.streak_best || 0);

    // Calculate points with streak bonus
    const { data: multiplier } = await supabaseAdmin
      .rpc("calculate_user_multiplier", { _profile_id: profile.id });

    const effectiveMultiplier = multiplier || 1;
    const streakBonus = Math.min(newStreak * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS);
    const basePoints = CHECKIN_POINTS + streakBonus;
    const pointsAwarded = Math.floor(basePoints * effectiveMultiplier);
    const newRawPoints = (profile.raw_points || 0) + pointsAwarded;

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        raw_points: newRawPoints,
        streak_current: newStreak,
        streak_best: newStreakBest,
        last_checkin: now.toISOString(),
        last_active_at: now.toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to check in" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create points ledger entry
    await supabaseAdmin
      .from("points_ledger")
      .insert({
        user_id: profile.id,
        amount: pointsAwarded,
        balance_after: newRawPoints,
        source: "checkin",
        description: `Daily check-in (Day ${newStreak})`,
      });

    // Log event
    await supabaseAdmin
      .from("events")
      .insert({
        user_id: profile.id,
        event_type: "daily_checkin",
        event_data: {
          streak_current: newStreak,
          streak_maintained: streakMaintained,
          base_points: basePoints,
          streak_bonus: streakBonus,
          multiplier: effectiveMultiplier,
          points_awarded: pointsAwarded,
        },
      });

    // Check for streak badge unlocks
    const streakBadges = [
      { streak: 7, badge_id: "streak_7" },
      { streak: 14, badge_id: "streak_14" },
      { streak: 30, badge_id: "streak_30" },
      { streak: 60, badge_id: "streak_60" },
      { streak: 90, badge_id: "streak_90" },
      { streak: 180, badge_id: "streak_180" },
      { streak: 365, badge_id: "streak_365" },
      { streak: 730, badge_id: "streak_730" },
    ];

    const earnedBadges: string[] = [];
    
    for (const sb of streakBadges) {
      if (newStreak >= sb.streak) {
        // Check if user already has this badge
        const { data: existingBadge } = await supabaseAdmin
          .from("user_badges")
          .select("id")
          .eq("user_id", profile.id)
          .eq("badge_id", sb.badge_id)
          .maybeSingle();

        if (!existingBadge) {
          // Award badge
          const { error: badgeError } = await supabaseAdmin
            .from("user_badges")
            .insert({
              user_id: profile.id,
              badge_id: sb.badge_id,
            });

          if (!badgeError) {
            earnedBadges.push(sb.badge_id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkin: {
          streak_current: newStreak,
          streak_best: newStreakBest,
          streak_maintained: streakMaintained,
          base_points: CHECKIN_POINTS,
          streak_bonus: streakBonus,
          multiplier: effectiveMultiplier,
          points_awarded: pointsAwarded,
        },
        new_balance: newRawPoints,
        earned_badges: earnedBadges,
        next_checkin: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in daily-checkin:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
