'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Moon, Globe, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/useUserStore';

export default function SettingsPage() {
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = () => {
    clearUser();
    router.push('/login');
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings ⚙️</h1>
        <p className="text-muted-foreground">
          Manage your preferences
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Streak Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded to check in daily</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Box Available</p>
              <p className="text-sm text-muted-foreground">Notify when boxes are ready</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Moon className="h-5 w-5" />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5" />
            <div>
              <CardTitle>Language</CardTitle>
              <CardDescription>Choose your preferred language</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">English (Default)</p>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
