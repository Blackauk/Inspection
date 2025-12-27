import { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Tabs } from './Tabs';
import { Badge } from './Badge';
import { Card } from './Card';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from './Toast';

interface UserProfile {
  fullName: string;
  displayName: string;
  phone: string;
  jobTitle: string;
  company: string;
  defaultSite: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  notifications: {
    email: boolean;
    inApp: boolean;
  };
  defaultLandingPage: string;
}

const STORAGE_KEY = 'ppma.profile';

const TIMEZONES = [
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
];

const LANDING_PAGES = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'work-orders', label: 'Work Orders' },
  { value: 'inspections', label: 'Inspections' },
  { value: 'assets', label: 'Assets' },
];

const mockSites = [
  { id: '1', name: 'Site A' },
  { id: '2', name: 'Site B' },
  { id: '3', name: 'Site C' },
];

interface MyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyProfileModal({ isOpen, onClose }: MyProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    displayName: '',
    phone: '',
    jobTitle: '',
    company: '',
    defaultSite: '',
    timezone: 'Europe/London',
    theme: 'system',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
      email: true,
      inApp: true,
    },
    defaultLandingPage: 'dashboard',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile from localStorage or initialize from user
  useEffect(() => {
    if (!isOpen) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
      }
    } else if (user) {
      // Initialize from user context
      setProfile({
        fullName: `${user.firstName} ${user.lastName}`,
        displayName: `${user.firstName} ${user.lastName}`,
        phone: '',
        jobTitle: '',
        company: user.company?.name || '',
        defaultSite: user.siteIds[0] || '',
        timezone: 'Europe/London',
        theme: 'system',
        dateFormat: 'DD/MM/YYYY',
        notifications: {
          email: true,
          inApp: true,
        },
        defaultLandingPage: 'dashboard',
      });
    }
  }, [isOpen, user]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      setHasChanges(true);
      return updated;
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNotificationChange = (key: 'email' | 'inApp', value: boolean) => {
    setProfile((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    setHasChanges(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (profile.phone && !/^[\d\s\-\+\(\)]+$/.test(profile.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      showToast('Please fix the errors before saving', 'error');
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      
      // Update user state in AuthContext with displayName
      if (profile.displayName !== undefined) {
        updateUser({ displayName: profile.displayName });
      }
      
      setHasChanges(false);
      showToast('Profile saved successfully', 'success');
    } catch (e) {
      console.error('Failed to save profile:', e);
      showToast('Failed to save profile', 'error');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getInitials = () => {
    if (user) {
      return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    }
    if (profile.fullName) {
      const parts = profile.fullName.split(' ');
      return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
    }
    return 'U';
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Manager':
        return 'warning';
      case 'Supervisor':
        return 'info';
      default:
        return 'default';
    }
  };

  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={profile.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              error={errors.fullName}
              required
            />
            <Input
              label="Display Name"
              value={profile.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="How your name appears to others"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="+44 123 456 7890"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              value={profile.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              placeholder="e.g. Maintenance Manager"
            />
            <Input
              label="Company"
              value={profile.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Default Site"
              value={profile.defaultSite}
              onChange={(e) => handleChange('defaultSite', e.target.value)}
              options={[
                { value: '', label: 'Select a site' },
                ...mockSites.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
            <Select
              label="Timezone"
              value={profile.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              options={TIMEZONES}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      content: (
        <div className="space-y-6">
          <Card>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Change Password</h3>
              <p className="text-sm text-gray-600 mb-4">
                Managed by your sign-in provider. Contact your administrator to change your password.
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Badge variant="default" size="sm">Coming soon</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-2">Active Sessions</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sign out of all devices to invalidate all active sessions.
              </p>
              <Button variant="outline" size="sm">
                Sign Out of All Devices
              </Button>
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <Select
              value={profile.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
            <Select
              value={profile.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              options={[
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
            <div className="space-y-3 mt-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={profile.notifications.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Email notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={profile.notifications.inApp}
                  onChange={(e) => handleNotificationChange('inApp', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">In-app notifications</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Landing Page</label>
            <Select
              value={profile.defaultLandingPage}
              onChange={(e) => handleChange('defaultLandingPage', e.target.value)}
              options={LANDING_PAGES}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'access',
      label: 'Access',
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="mt-1">
              <Badge variant={getRoleBadgeVariant(user?.role)}>{user?.role || 'N/A'}</Badge>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-gray-600">
                {user?.role === 'Admin' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Full system access</li>
                    <li>Manage users and roles</li>
                    <li>Configure system settings</li>
                    <li>View all data across all sites</li>
                  </ul>
                )}
                {user?.role === 'Manager' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Manage work orders and inspections</li>
                    <li>Approve and review submissions</li>
                    <li>View reports and analytics</li>
                    <li>Manage assigned sites</li>
                  </ul>
                )}
                {user?.role === 'Supervisor' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Create and assign work orders</li>
                    <li>Review inspections</li>
                    <li>View assigned site data</li>
                  </ul>
                )}
                {user?.role === 'Fitter' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>Complete assigned work orders</li>
                    <li>Perform inspections</li>
                    <li>View assigned tasks</li>
                  </ul>
                )}
                {user?.role === 'Viewer' && (
                  <ul className="list-disc list-inside space-y-1">
                    <li>View-only access</li>
                    <li>Read reports and data</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Sites</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {user?.siteIds?.map((siteId) => {
                const site = mockSites.find((s) => s.id === siteId);
                return site ? (
                  <Badge key={siteId} variant="default" size="sm">
                    {site.name}
                  </Badge>
                ) : null;
              }) || <span className="text-sm text-gray-500">No sites assigned</span>}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="My Profile" size="lg">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
            {getInitials()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {profile.displayName || profile.fullName || `${user?.firstName} ${user?.lastName}`}
              </h3>
              {user?.role && (
                <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                  {user.role}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Upload Photo
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab={activeTab} onTabChange={setActiveTab} />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}


