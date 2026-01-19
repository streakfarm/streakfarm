import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function usePoints(userId: string) {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    // Initial load
    supabase
      .from("points_ledger")
      .select("points")
      .eq("user_id", userId)
      .then(({ data }) => {
        const total = data?.reduce((sum, r) => sum + r.points, 0) || 0;
        setPoints(total);
      });

    // Realtime updates
    const channel = supabase
      .channel("points-ledger")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "points_ledger",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setPoints((prev) => prev + payload.new.points);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return points;
}
