import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BoxConfig {
  boxes_per_hour: number;
  box_expiry_hours: number;
  max_boxes_per_day: number;
  rarity_weights: {
    common: number;
    rare: number;
    legendary: number;
  };
  point_ranges: {
    common: { min: number; max: number };
    rare: { min: number; max: number };
    legendary: { min: number; max: number };
  };
}

const DEFAULT_CONFIG: BoxConfig = {
  boxes_per_hour: 1,
  box_expiry_hours: 3,
  max_boxes_per_day: 24,
  rarity_weights: {
    common: 85,
    rare: 14,
    legendary: 1,
  },
  point_ranges: {
    common: { min: 50, max: 1000 },
    rare: { min: 1000, max: 5000 },
    legendary: { min: 5000, max: 10000 },
  },
};

function determineRarity(weights: BoxConfig["rarity_weights"]): "common" | "rare" | "legendary" {
  const roll = Math.random() * 100;
  if (roll < weights.legendary) return "legendary";
  if (roll < weights.legendary + weights.rare) return "rare";
  return "common";
}

function getRandomPoints(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get box configuration from admin_config
    const { data: configData } = await adminClient
      .from("admin_config")
      .select("value")
      .eq("id", "box_settings")
      .maybeSingle();

    const config: BoxConfig = configData?.value 
      ? { ...DEFAULT_CONFIG, ...(configData.value as Partial<BoxConfig>) }
      : DEFAULT_CONFIG;

    // Get all active users (users who were active in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activeUsers, error: usersError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("is_banned", false)
      .gte("last_active_at", sevenDaysAgo.toISOString());

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    if (!activeUsers || activeUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active users", boxes_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const expiresAt = new Date(now);
    expiresAt.setHours(expiresAt.getHours() + config.box_expiry_hours);

    let boxesCreated = 0;
    const errors: string[] = [];

    // Generate boxes for each active user
    for (const user of activeUsers) {
      try {
        // Check how many boxes user has received today
        const { count: todayBoxCount } = await adminClient
          .from("boxes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("generated_at", todayStart.toISOString());

        if ((todayBoxCount || 0) >= config.max_boxes_per_day) {
          continue; // User already has max boxes for today
        }

        // Check if user already has a pending box from this hour
        const hourStart = new Date(now);
        hourStart.setMinutes(0, 0, 0);

        const { count: hourBoxCount } = await adminClient
          .from("boxes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("generated_at", hourStart.toISOString());

        if ((hourBoxCount || 0) >= config.boxes_per_hour) {
          continue; // User already has a box for this hour
        }

        // Generate box
        const rarity = determineRarity(config.rarity_weights);
        const pointRange = config.point_ranges[rarity];
        const basePoints = getRandomPoints(pointRange.min, pointRange.max);

        const { error: insertError } = await adminClient.from("boxes").insert({
          user_id: user.id,
          rarity,
          base_points: basePoints,
          expires_at: expiresAt.toISOString(),
          generated_at: now.toISOString(),
        });

        if (insertError) {
          errors.push(`User ${user.id}: ${insertError.message}`);
        } else {
          boxesCreated++;
        }
      } catch (err) {
        errors.push(`User ${user.id}: ${(err as Error).message}`);
      }
    }

    console.log(`Generated ${boxesCreated} boxes for ${activeUsers.length} active users`);
    if (errors.length > 0) {
      console.warn("Errors:", errors.slice(0, 10));
    }

    return new Response(
      JSON.stringify({
        success: true,
        boxes_created: boxesCreated,
        active_users: activeUsers.length,
        errors_count: errors.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-boxes:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
