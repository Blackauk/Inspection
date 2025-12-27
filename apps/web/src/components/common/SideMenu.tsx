import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import type { UserRole } from '@ppm/shared';

interface MenuItem {
  label: string;
  path: string;
  icon?: string;
  roles?: UserRole[];
  section?: string;
}

const menuItems: MenuItem[] = [
  // Top-level pages (in exact order)
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Assets', path: '/assets', icon: '🔧' },
  { label: 'Work Orders', path: '/work-orders', icon: '📋' },
  { label: 'PM Schedules', path: '/pm-schedules', icon: '📅' },
  { label: 'Inspections', path: '/inspections', icon: '✅' },
  { label: 'Defects', path: '/defects', icon: '⚠️' },
  { label: 'Reports', path: '/reports', icon: '📈', roles: ['Manager', 'Supervisor', 'Admin'] },
  { label: 'Handover', path: '/handovers', icon: '📝' },
  { label: 'Settings', path: '/settings', icon: '⚙️', roles: ['Admin'] },
  
  // Support (bottom, separated visually)
  { label: 'Support', path: '/help', icon: '❓', section: 'Support' },
];

export function SideMenu() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { syncStatus } = useOffline();
  const location = useLocation();

  const canAccess = (item: MenuItem): boolean => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const filteredItems = menuItems.filter(canAccess);
  
  // Separate main items from support
  const mainItems = filteredItems.filter(item => !item.section || item.section !== 'Support');
  const supportItems = filteredItems.filter(item => item.section === 'Support');

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'syncing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <aside
      className={`bg-gray-900 flex flex-col transition-all duration-300 sticky top-0 h-screen ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4">
        {!collapsed && <h1 className="text-lg font-bold text-white">CoreCheck</h1>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col">
        {/* Main Navigation Items */}
        <div className="space-y-1 flex-1">
          {mainItems.map((item) => {
            // Special handling for Settings - highlight if on any /settings/* route
            const isActive = item.path === '/settings'
              ? location.pathname.startsWith('/settings')
              : location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg flex-shrink-0">{item.icon || '•'}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Support Section (bottom, separated) */}
        {supportItems.length > 0 && (
          <div className="mt-auto pt-4 border-t border-gray-800">
            <div className="space-y-1">
              {supportItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon || '•'}</span>
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
