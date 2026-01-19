import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Mark expired boxes
    const { data: expiredBoxes, error: updateError } = await adminClient
      .from("boxes")
      .update({ is_expired: true })
      .lt("expires_at", now.toISOString())
      .is("opened_at", null)
      .eq("is_expired", false)
      .select("id");

    if (updateError) {
      throw updateError;
    }

    const expiredCount = expiredBoxes?.length || 0;
    console.log(`Marked ${expiredCount} boxes as expired`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in expire-boxes:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
