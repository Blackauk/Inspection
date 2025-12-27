import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { getDisplayName } from '../utils/userUtils';

export default function DebugPanel() {
  const { user } = useAuth();
  const { isOnline, syncStatus, queueItems } = useOffline();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? 'http://localhost:3001' : '/api');

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-xs z-50">
      <div className="font-bold mb-2 border-b border-gray-700 pb-2">Debug Panel</div>
      <div className="space-y-1">
        <div>
          <span className="text-gray-400">User:</span> {getDisplayName(user)}
        </div>
        <div>
          <span className="text-gray-400">Role:</span> {user?.role}
        </div>
        <div>
          <span className="text-gray-400">Sites:</span> {user?.siteIds.length || 0}
        </div>
        <div>
          <span className="text-gray-400">API URL:</span> {apiBaseUrl}
        </div>
        <div>
          <span className="text-gray-400">Status:</span> {isOnline ? 'Online' : 'Offline'} ({syncStatus})
        </div>
        <div>
          <span className="text-gray-400">Queue:</span> {queueItems.length} items
        </div>
      </div>
    </div>
  );
}













