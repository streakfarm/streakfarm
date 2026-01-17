import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/hooks/useTelegram';

export default function Debug() {
  const auth = useAuth();
  const telegram = useTelegram();
  
  return (
    <AppLayout>
      <div className="p-4 space-y-4 text-xs font-mono">
        <h1 className="text-xl font-bold">Debug Info</h1>
        
        <div className="bg-gray-800 p-3 rounded">
          <h2 className="text-yellow-500 mb-2">Auth Status:</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(auth, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h2 className="text-green-500 mb-2">Telegram Data:</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(telegram, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h2 className="text-blue-500 mb-2">Window.Telegram:</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(window.Telegram?.WebApp, null, 2)}
          </pre>
        </div>
      </div>
    </AppLayout>
  );
}
