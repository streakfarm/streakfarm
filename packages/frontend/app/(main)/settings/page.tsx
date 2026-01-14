'use client';

import { Settings, Bell, Moon, Globe, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api/auth';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useUIStore } from '@/lib/stores/useUIStore';

export default function SettingsPage() {
  const router = useRouter();
  const { clearUser } = useUserStore();
  const { showToast } = useUIStore();
  
  const handleLogout = () => {
    logout();
    clearUser();
    showToast('Logged out successfully', 'info');
    router.replace('/login');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences
        </p>
      </div>
      
      {/* Settings Cards */}
      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Streak reminders and updates
                </p>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">Coming soon</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Follows Telegram theme
                </p>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">Auto</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">Language</p>
                <p className="text-sm text-muted-foreground">
                  App language
                </p>
              </div>
            </div>
            <div className="text-muted-foreground text-sm">English</div>
          </div>
        </Card>
      </div>
      
      {/* About */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">About StreakFarm</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>Build daily streaks and earn rewards</p>
          <p className="pt-2">
            <a href="https://streakfarm.app/terms" className="text-primary hover:underline">
              Terms of Service
            </a>
            {' • '}
            <a href="https://streakfarm.app/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </Card>
      
      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full"
        size="lg"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </div>
  );
}
