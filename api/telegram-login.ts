import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyTelegram(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return computedHash === hash;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: "Missing initData" });
    }

    const isValid = verifyTelegram(
      initData,
      process.env.TG_BOT_TOKEN!
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid Telegram auth" });
    }

    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get("user")!);

    await supabase.from("users").upsert({
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
    });

    const token = jwt.sign(
      { telegram_id: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Telegram auth failed" });
  }
}
