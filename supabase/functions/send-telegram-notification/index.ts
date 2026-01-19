import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  telegram_id: number;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface BulkNotificationPayload {
  type: 'checkin_reminder' | 'expiring_boxes';
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  parseMode: string = 'HTML'
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      }
    );

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Single notification
    if (body.telegram_id) {
      const { telegram_id, title, body: messageBody } = body as NotificationPayload;
      
      const message = `<b>${title}</b>\n\n${messageBody}`;
      const success = await sendTelegramMessage(botToken, telegram_id, message);

      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulk notifications
    const { type } = body as BulkNotificationPayload;

    if (type === 'checkin_reminder') {
      // Find users who haven't checked in today and have telegram_id
      const today = new Date().toISOString().split('T')[0];
      
      const { data: users, error } = await supabase
        .from('profiles')
        .select('telegram_id, first_name, streak_current, last_checkin')
        .not('telegram_id', 'is', null)
        .eq('is_banned', false);

      if (error) throw error;

      const usersToNotify = users?.filter(user => {
        if (!user.last_checkin) return true;
        const lastCheckin = new Date(user.last_checkin).toISOString().split('T')[0];
        return lastCheckin !== today;
      }) || [];

      let sent = 0;
      let failed = 0;

      for (const user of usersToNotify) {
        const streakWarning = user.streak_current && user.streak_current > 0
          ? `\n\n⚠️ Don't lose your <b>${user.streak_current}-day streak!</b>`
          : '';

        const message = `🔥 <b>Daily Check-in Reminder</b>\n\nHey ${user.first_name || 'Farmer'}! Your daily reward is waiting for you.${streakWarning}\n\n👉 Open StreakFarm to claim your points!`;

        const success = await sendTelegramMessage(botToken, user.telegram_id!, message);
        if (success) sent++;
        else failed++;

        // Rate limiting - Telegram allows ~30 messages/second
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Log the notification event
      await supabase.from('events').insert({
        event_type: 'bulk_notification_sent',
        event_data: { type: 'checkin_reminder', sent, failed, total: usersToNotify.length },
      });

      return new Response(
        JSON.stringify({ success: true, sent, failed, total: usersToNotify.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'expiring_boxes') {
      // Find boxes expiring in the next 2 hours
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const { data: expiringBoxes, error } = await supabase
        .from('boxes')
        .select(`
          id,
          base_points,
          rarity,
          expires_at,
          user_id,
          profiles!inner(telegram_id, first_name)
        `)
        .is('opened_at', null)
        .eq('is_expired', false)
        .gte('expires_at', now.toISOString())
        .lte('expires_at', twoHoursFromNow.toISOString());

      if (error) throw error;

      // Group boxes by user
      const userBoxes = new Map<number, { boxes: typeof expiringBoxes, firstName: string }>();
      
      for (const box of expiringBoxes || []) {
        const profile = box.profiles as unknown as { telegram_id: number; first_name: string };
        if (!profile?.telegram_id) continue;

        if (!userBoxes.has(profile.telegram_id)) {
          userBoxes.set(profile.telegram_id, { boxes: [], firstName: profile.first_name || 'Farmer' });
        }
        userBoxes.get(profile.telegram_id)!.boxes.push(box);
      }

      let sent = 0;
      let failed = 0;

      for (const [telegramId, { boxes, firstName }] of userBoxes) {
        const boxCount = boxes.length;
        const totalPoints = boxes.reduce((sum, b) => sum + b.base_points, 0);
        const hasRare = boxes.some(b => b.rarity === 'rare' || b.rarity === 'legendary');

        const urgency = hasRare ? '🚨' : '⏰';
        const rareNote = hasRare ? '\n\n💎 <b>Includes rare boxes!</b>' : '';

        const message = `${urgency} <b>Mystery Boxes Expiring Soon!</b>\n\nHey ${firstName}! You have <b>${boxCount} box${boxCount > 1 ? 'es' : ''}</b> expiring in less than 2 hours.\n\n📦 Potential points: <b>${totalPoints.toLocaleString()}+</b>${rareNote}\n\n👉 Open them now before they're gone!`;

        const success = await sendTelegramMessage(botToken, telegramId, message);
        if (success) sent++;
        else failed++;

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Log the notification event
      await supabase.from('events').insert({
        event_type: 'bulk_notification_sent',
        event_data: { type: 'expiring_boxes', sent, failed, total: userBoxes.size },
      });

      return new Response(
        JSON.stringify({ success: true, sent, failed, total: userBoxes.size }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid notification type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
