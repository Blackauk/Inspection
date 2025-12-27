import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, HelpCircle, AlertTriangle, ClipboardList, ClipboardCheck, PlusSquare, QrCode, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalSearch } from '../../contexts/GlobalSearchContext';
import { useWorkOrderModal } from '../../contexts/WorkOrderModalContext';
import { useAssetModal } from '../../contexts/AssetModalContext';
import { useDefectModal } from '../../contexts/DefectModalContext';
import { canRaiseDefect } from '../../features/defects/lib/permissions';
import { HelpPanel } from '../../features/help/components/HelpPanel';
import { MyProfileModal } from './MyProfileModal';
import { getDisplayName, getUserInitials } from '../../utils/userUtils';

const mockSites = [
  { id: '1', name: 'Site A' },
  { id: '2', name: 'Site B' },
  { id: '3', name: 'Site C' },
  { id: '4', name: 'Site D' },
];

export function TopBar() {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSiteMenu, setShowSiteMenu] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [helpArticleId, setHelpArticleId] = useState<string | undefined>(undefined);
  const [selectedSite, setSelectedSite] = useState(mockSites[0]);
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useGlobalSearch();
  const { openCreateModal } = useWorkOrderModal();
  const { openAddAssetDropdown } = useAssetModal();
  const { openReportDefectDropdown } = useDefectModal();
  const navigate = useNavigate();

  // Mock unread notifications count - replace with real data later
  const unreadNotificationsCount = 3;

  // Listen for custom event to open help with specific article
  useEffect(() => {
    const handleOpenHelp = (e: CustomEvent) => {
      if (e.detail?.articleId) {
        setHelpArticleId(e.detail.articleId);
        setShowHelpPanel(true);
      } else {
        setShowHelpPanel(true);
      }
    };

    window.addEventListener('openHelp' as any, handleOpenHelp);
    return () => {
      window.removeEventListener('openHelp' as any, handleOpenHelp);
    };
  }, []);

  interface QuickAction {
    label: string;
    action?: () => void;
    path?: string;
    icon?: typeof AlertTriangle;
    visible?: boolean;
  }

  // Check if user can create handovers (same permissions as work orders/inspections)
  const canCreateHandover = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');

  const quickActions: QuickAction[] = [
    { 
      label: 'New Work Order', 
      action: () => openCreateModal(),
      icon: ClipboardList,
    },
    { 
      label: 'New Inspection', 
      action: () => navigate('/inspections/start'),
      icon: ClipboardCheck,
    },
    { 
      label: 'New Handover', 
      action: () => navigate('/handovers', { state: { openCreateModal: true } }),
      icon: FileText,
      visible: canCreateHandover,
    },
    { 
      label: 'Add Asset', 
      action: () => openAddAssetDropdown(),
      icon: PlusSquare,
    },
    { 
      label: 'Scan QR', 
      action: () => console.log('Scan QR - placeholder'),
      icon: QrCode,
    },
    { 
      label: 'Report Defect', 
      action: () => openReportDefectDropdown(),
      icon: AlertTriangle,
      visible: canRaiseDefect(user?.role),
    },
  ].filter(action => action.visible !== false);

  const handleQuickAction = (action: QuickAction) => {
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigate(action.path);
    }
    setShowQuickActions(false);
  };

  const handleProfileAction = async (action: string) => {
    if (action === 'signout') {
      await logout();
    } else if (action === 'notifications') {
      // Navigate to notifications page or open panel
      // For now, just close the menu - can be extended later
      navigate('/dashboard'); // Placeholder - will show notifications panel
    } else if (action === 'preferences') {
      navigate('/preferences');
    } else if (action === 'profile') {
      setShowMyProfile(true);
    } else if (action === 'activity') {
      navigate('/audit-log');
    } else if (action === 'help') {
      setShowHelpPanel(true);
    }
    setShowProfileMenu(false);
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search assets, work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Quick Actions
          </button>
          {showQuickActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowQuickActions(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                    >
                      {Icon ? (
                        <Icon className="w-4 h-4 text-slate-500" />
                      ) : (
                        <span className="w-4 h-4" />
                      )}
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Site Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSiteMenu(!showSiteMenu)}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            📍 {selectedSite.name}
          </button>
          {showSiteMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSiteMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                {mockSites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      setSelectedSite(site);
                      setShowSiteMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedSite.id === site.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {site.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {getUserInitials(user)}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {getDisplayName(user)}
            </span>
          </button>
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <button
                  onClick={() => handleProfileAction('profile')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
                >
                  My Profile
                </button>
                <button
                  onClick={() => handleProfileAction('activity')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  Activity Log
                </button>
                <button
                  onClick={() => handleProfileAction('notifications')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleProfileAction('preferences')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Preferences</span>
                </button>
                <button
                  onClick={() => handleProfileAction('help')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Help</span>
                </button>
                <button
                  onClick={() => {
                    setShowSiteMenu(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  Switch Site
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => handleProfileAction('signout')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help Panel */}
      <HelpPanel
        isOpen={showHelpPanel}
        onClose={() => {
          setShowHelpPanel(false);
          setHelpArticleId(undefined);
        }}
        initialArticleId={helpArticleId}
      />

      {/* My Profile Modal */}
      <MyProfileModal
        isOpen={showMyProfile}
        onClose={() => setShowMyProfile(false)}
      />
    </div>
  );
}
