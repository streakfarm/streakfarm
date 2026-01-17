import { AppLayout } from '@/components/layout/AppLayout';

export default function Profile() {
  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-green-500">✅ Profile Works!</h1>
        <p className="text-white">Navigation is working fine.</p>
        <p className="text-muted-foreground text-sm">
          If you see this, the issue is in the original Profile code.
        </p>
      </div>
    </AppLayout>
  );
}
