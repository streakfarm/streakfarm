import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Send,
  Loader2,
  Calendar,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationResult {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
}

export function AdminNotificationsPanel() {
  const [sendingCheckin, setSendingCheckin] = useState(false);
  const [sendingBoxes, setSendingBoxes] = useState(false);
  const [lastResults, setLastResults] = useState<{
    checkin?: NotificationResult;
    boxes?: NotificationResult;
  }>({});

  const sendCheckinReminders = async () => {
    setSendingCheckin(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { type: 'checkin_reminder' }
      });

      if (error) throw error;

      setLastResults(prev => ({ ...prev, checkin: data }));
      toast.success(`Sent ${data.sent} check-in reminders`);
    } catch (error) {
      console.error('Failed to send check-in reminders:', error);
      toast.error('Failed to send check-in reminders');
    } finally {
      setSendingCheckin(false);
    }
  };

  const sendExpiringBoxReminders = async () => {
    setSendingBoxes(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { type: 'expiring_boxes' }
      });

      if (error) throw error;

      setLastResults(prev => ({ ...prev, boxes: data }));
      toast.success(`Sent ${data.sent} expiring box reminders`);
    } catch (error) {
      console.error('Failed to send box reminders:', error);
      toast.error('Failed to send box reminders');
    } finally {
      setSendingBoxes(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Push Notifications</h2>
        <p className="text-sm text-muted-foreground">Send Telegram notifications to users</p>
      </div>

      <div className="grid gap-4">
        {/* Daily Check-in Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-green-500" />
                Daily Check-in Reminders
              </CardTitle>
              <CardDescription>
                Remind users who haven't checked in today to claim their daily reward
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Sends to all users who haven't claimed their daily reward yet
                </div>
                <Button 
                  onClick={sendCheckinReminders}
                  disabled={sendingCheckin}
                  className="gap-2"
                >
                  {sendingCheckin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Reminders
                </Button>
              </div>

              {lastResults.checkin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {lastResults.checkin.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium">Last Send Results</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">{lastResults.checkin.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">{lastResults.checkin.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{lastResults.checkin.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expiring Boxes Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-purple-500" />
                Expiring Box Alerts
              </CardTitle>
              <CardDescription>
                Alert users about mystery boxes that will expire in the next 2 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Warns users about boxes they might lose if not opened soon
                </div>
                <Button 
                  onClick={sendExpiringBoxReminders}
                  disabled={sendingBoxes}
                  variant="secondary"
                  className="gap-2"
                >
                  {sendingBoxes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Alerts
                </Button>
              </div>

              {lastResults.boxes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {lastResults.boxes.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-medium">Last Send Results</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">{lastResults.boxes.sent}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">{lastResults.boxes.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{lastResults.boxes.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-primary" />
                How Notifications Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Notifications are sent via Telegram Bot API
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Users must have opened the app via Telegram to receive notifications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Check-in reminders target users who haven't checked in today
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Box alerts target users with boxes expiring in 2 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  All notification events are logged for analytics
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
