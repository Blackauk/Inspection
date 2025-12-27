import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';
import { useTestMode } from '../contexts/TestModeContext';
import DebugPanel from './DebugPanel';

export default function Layout() {
  const { user, logout } = useAuth();
  const { syncStatus, queueItems } = useOffline();
  const { testModeEnabled, toggleTestMode } = useTestMode();
  const location = useLocation();
  
  // Show test mode toggle for Admin/Manager/Developer roles or in dev mode
  const canToggleTestMode = ['Admin', 'Manager', 'Developer'].includes(user?.role || '') || import.meta.env.DEV;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Assets', href: '/assets' },
    { name: 'Work Orders', href: '/work-orders' },
    { name: 'Handovers', href: '/handovers' },
    { name: 'Checks', href: '/checks' },
  ];

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'syncing':
        return 'bg-yellow-500';
      case 'synced':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">CoreCheck</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8 sm:items-center">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                {canToggleTestMode && (
                  <div className="ml-6 flex items-center gap-2 px-2 py-1 border-l border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={testModeEnabled}
                        onChange={toggleTestMode}
                        className="rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-xs font-medium text-gray-700">Test Mode</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-0">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getSyncStatusColor()}`} />
                <span className="text-sm text-gray-600">
                  {syncStatus === 'online' && 'Online'}
                  {syncStatus === 'offline' && 'Offline'}
                  {syncStatus === 'syncing' && 'Syncing...'}
                  {syncStatus === 'synced' && 'Synced'}
                  {syncStatus === 'failed' && 'Sync Failed'}
                </span>
                {queueItems.length > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {queueItems.length} pending
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName} ({user?.role})
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <DebugPanel />
    </div>
  );
}


