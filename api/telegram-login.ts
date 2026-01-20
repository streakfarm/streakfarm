import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req, res) {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: "No initData" });

    const parsed = new URLSearchParams(initData);
    const hash = parsed.get("hash");
    parsed.delete("hash");

    const dataCheckString = [...parsed.entries()]
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secret = crypto
      .createHash("sha256")
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash)
      return res.status(403).json({ error: "Invalid Telegram auth" });

    const user = JSON.parse(parsed.get("user")!);

    const { data } = await supabase
      .from("users")
      .upsert({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
      })
      .select()
      .single();

    return res.json({ user: data });
  } catch (e) {
    return res.status(500).json({ error: "Login failed" });
  }
}
