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
    const { taskId, verificationData } = await req.json();

    if (!taskId || typeof taskId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid taskId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, raw_points, total_tasks_completed, wallet_address")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the task
    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("status", "active")
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: "Task not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if task requires wallet
    if (task.requires_wallet && !profile.wallet_address) {
      return new Response(
        JSON.stringify({ error: "Wallet connection required for this task" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check availability window
    const now = new Date();
    if (task.available_from && new Date(task.available_from) > now) {
      return new Response(
        JSON.stringify({ error: "Task not yet available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (task.available_until && new Date(task.available_until) < now) {
      return new Response(
        JSON.stringify({ error: "Task has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check previous completions
    const { data: completions, error: completionsError } = await supabaseAdmin
      .from("task_completions")
      .select("id, completed_at")
      .eq("user_id", profile.id)
      .eq("task_id", taskId)
      .order("completed_at", { ascending: false });

    if (completionsError) {
      console.error("Error fetching completions:", completionsError);
    }

    const completionCount = completions?.length || 0;

    // Check max completions
    if (task.max_completions && completionCount >= task.max_completions) {
      return new Response(
        JSON.stringify({ error: "Maximum completions reached" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check repeat interval for repeatable tasks
    if (task.is_repeatable && task.repeat_interval_hours && completions && completions.length > 0) {
      const lastCompletion = new Date(completions[0].completed_at);
      const nextAllowed = new Date(lastCompletion.getTime() + task.repeat_interval_hours * 60 * 60 * 1000);
      if (now < nextAllowed) {
        return new Response(
          JSON.stringify({ 
            error: "Task on cooldown",
            next_available: nextAllowed.toISOString()
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For non-repeatable tasks, check if already completed
    if (!task.is_repeatable && completionCount > 0) {
      return new Response(
        JSON.stringify({ error: "Task already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate points with multiplier
    const { data: multiplier } = await supabaseAdmin
      .rpc("calculate_user_multiplier", { _profile_id: profile.id });

    const effectiveMultiplier = multiplier || 1;
    const pointsAwarded = Math.floor(task.points_reward * effectiveMultiplier);
    const newRawPoints = (profile.raw_points || 0) + pointsAwarded;
    const newTotalTasks = (profile.total_tasks_completed || 0) + 1;

    // Create task completion
    const { error: insertError } = await supabaseAdmin
      .from("task_completions")
      .insert({
        user_id: profile.id,
        task_id: taskId,
        points_awarded: pointsAwarded,
        is_verified: true,
        verification_data: verificationData || {},
      });

    if (insertError) {
      console.error("Error creating completion:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to complete task" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        raw_points: newRawPoints,
        total_tasks_completed: newTotalTasks,
      })
      .eq("id", profile.id);

    // Create points ledger entry
    await supabaseAdmin
      .from("points_ledger")
      .insert({
        user_id: profile.id,
        amount: pointsAwarded,
        balance_after: newRawPoints,
        source: "task",
        source_id: taskId,
        description: `Completed task: ${task.title}`,
      });

    // Log event
    await supabaseAdmin
      .from("events")
      .insert({
        user_id: profile.id,
        event_type: "task_completed",
        event_data: {
          task_id: taskId,
          task_type: task.task_type,
          points_base: task.points_reward,
          multiplier: effectiveMultiplier,
          points_awarded: pointsAwarded,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        task: {
          id: taskId,
          title: task.title,
          points_base: task.points_reward,
          multiplier: effectiveMultiplier,
          points_awarded: pointsAwarded,
        },
        new_balance: newRawPoints,
        total_tasks_completed: newTotalTasks,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in complete-task:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
