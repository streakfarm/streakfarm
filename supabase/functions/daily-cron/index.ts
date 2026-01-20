import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const steps = [
    "generate-boxes",
    "daily-checkin",
    "expire-boxes"
  ];

  for (const fn of steps) {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ success: false, fn, error: text }),
        { status: 500 }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
});
