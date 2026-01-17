import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/hooks/useTelegram';

export default function Profile() {
  const auth = useAuth();
  const telegram = useTelegram();
  
  return (
    <AppLayout>
      <div className="p-4 space-y-4 text-xs overflow-auto pb-24">
        <h1 className="text-xl font-bold text-white mb-4">🔍 Debug Info</h1>
        
        <div className="bg-yellow-900/30 p-3 rounded border border-yellow-600">
          <h2 className="text-yellow-400 font-bold mb-2">Auth Status:</h2>
          <div className="bg-black/50 p-2 rounded">
            <p className="text-white">isLoading: {String(auth.isLoading)}</p>
            <p className="text-white">isAuthenticated: {String(auth.isAuthenticated)}</p>
            <p className="text-white">user: {auth.user ? JSON.stringify(auth.user) : 'null'}</p>
          </div>
        </div>
        
        <div className="bg-green-900/30 p-3 rounded border border-green-600">
          <h2 className="text-green-400 font-bold mb-2">Telegram Status:</h2>
          <div className="bg-black/50 p-2 rounded">
            <p className="text-white">isTelegram: {String(telegram.isTelegram)}</p>
            <p className="text-white">isReady: {String(telegram.isReady)}</p>
            <p className="text-white">user: {telegram.user ? JSON.stringify(telegram.user) : 'null'}</p>
          </div>
        </div>
        
        <div className="bg-blue-900/30 p-3 rounded border border-blue-600">
          <h2 className="text-blue-400 font-bold mb-2">Window.Telegram:</h2>
          <div className="bg-black/50 p-2 rounded">
            <p className="text-white break-all">
              {typeof window !== 'undefined' && window.Telegram?.WebApp 
                ? JSON.stringify(window.Telegram.WebApp.initData) 
                : 'Not available'}
            </p>
          </div>
        </div>
        
        <div className="bg-purple-900/30 p-3 rounded border border-purple-600">
          <h2 className="text-purple-400 font-bold mb-2">Window Location:</h2>
          <div className="bg-black/50 p-2 rounded">
            <p className="text-white break-all">
              {typeof window !== 'undefined' ? window.location.href : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
