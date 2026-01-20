import crypto from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: "Missing initData" });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      throw new Error("BOT TOKEN NOT SET");
    }

    // ---------- VERIFY TELEGRAM SIGNATURE ----------
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secret = crypto
      .createHash("sha256")
      .update(BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secret)
      .update(dataCheckString)
      .digest("hex");

    if (computedHash !== hash) {
      return res.status(401).json({ error: "Invalid Telegram signature" });
    }

    // ---------- PARSE USER ----------
    const user = JSON.parse(params.get("user") || "{}");

    if (!user.id) {
      return res.status(400).json({ error: "User missing" });
    }

    return res.status(200).json({
      ok: true,
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
    });
  } catch (err: any) {
    console.error("Telegram login error:", err);
    return res.status(500).json({
      error: "Server configuration error",
      message: err.message,
    });
  }
}
