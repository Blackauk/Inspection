import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Settings, Users, MapPin, Tag, FileText, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

interface OverviewCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

export function SettingsOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cards: OverviewCard[] = [
    {
      id: 'app-settings',
      title: 'App Settings',
      description: 'Configure global application behavior and defaults',
      icon: <Settings className="w-8 h-8" />,
      path: '/settings/app-settings',
    },
    {
      id: 'users',
      title: 'Users & Roles',
      description: 'Manage users, roles, and permissions',
      icon: <Users className="w-8 h-8" />,
      path: '/settings/users',
      roles: ['Admin'],
    },
    {
      id: 'sites',
      title: 'Sites & Locations',
      description: 'Manage sites and location hierarchy',
      icon: <MapPin className="w-8 h-8" />,
      path: '/settings/sites',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'categories',
      title: 'Categories',
      description: 'Manage asset and defect categories',
      icon: <Tag className="w-8 h-8" />,
      path: '/settings/categories',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'tags',
      title: 'Tags',
      description: 'Manage flexible labels across the app',
      icon: <FileText className="w-8 h-8" />,
      path: '/settings/tags',
      roles: ['Admin', 'Manager'],
    },
    {
      id: 'audit-log',
      title: 'Audit Log',
      description: 'View system activity and audit trail',
      icon: <Shield className="w-8 h-8" />,
      path: '/settings/audit-log',
      roles: ['Admin'],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure alerts and notification preferences',
      icon: <Bell className="w-8 h-8" />,
      path: '/settings/notifications',
    },
  ];

  const canAccess = (card: OverviewCard): boolean => {
    if (!card.roles) return true;
    if (!user) return false;
    return card.roles.includes(user.role);
  };

  const accessibleCards = cards.filter(canAccess);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings Overview</h2>
        <p className="text-gray-600">Select a section to manage system configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accessibleCards.map((card) => (
          <Card
            key={card.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(card.path)}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-blue-600">{card.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {accessibleCards.length === 0 && (
        <Card>
          <div className="p-8 text-center text-gray-500">
            <p>You don't have access to any settings sections.</p>
          </div>
        </Card>
      )}
    </div>
  );
}


