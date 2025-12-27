import { Link, useLocation } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Users, 
  MapPin, 
  Tag, 
  FileText, 
  Bell, 
  Shield,
  FileImage,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

interface SettingsMenuProps {
  className?: string;
}

export function SettingsMenu({ className = '' }: SettingsMenuProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <SettingsIcon className="w-5 h-5" />,
      path: '/settings/overview',
    },
    {
      id: 'app-settings',
      label: 'App Settings',
      icon: <SettingsIcon className="w-5 h-5" />,
      path: '/settings/app-settings',
    },
    {
      id: 'users',
      label: 'Users & Roles',
      icon: <Users className="w-5 h-5" />,
      path: '/settings/users',
      roles: ['Admin'],
    },
    {
      id: 'sites',
      label: 'Sites & Locations',
      icon: <MapPin className="w-5 h-5" />,
      path: '/settings/sites',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <Tag className="w-5 h-5" />,
      path: '/settings/categories',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: <FileText className="w-5 h-5" />,
      path: '/settings/tags',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      icon: <Shield className="w-5 h-5" />,
      path: '/settings/audit-log',
      roles: ['Admin'],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      path: '/settings/notifications',
    },
    {
      id: 'pdf-branding',
      label: 'Branding',
      icon: <FileImage className="w-5 h-5" />,
      path: '/settings/pdf-branding',
      roles: ['Admin'],
    },
  ];

  const canAccess = (item: MenuItem): boolean => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const filteredItems = menuItems.filter(canAccess);

  const isActive = (path: string) => {
    if (path === '/settings' || path === '/settings/overview') {
      return location.pathname === '/settings' || location.pathname === '/settings/' || location.pathname === '/settings/overview';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">
            {filteredItems.find(item => isActive(item.path))?.label || 'Settings Menu'}
          </span>
          {mobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-500" />
          ) : (
            <Menu className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
          mobileMenuOpen ? 'block' : 'hidden'
        } lg:block ${className}`}
      >
        <div className="p-2">
          {filteredItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={active ? 'text-blue-600' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span className="flex-1 text-sm">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 text-blue-600" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

