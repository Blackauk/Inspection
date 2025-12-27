import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { showToast } from '../../../components/common/Toast';
import { 
  loadNotificationSettings, 
  saveNotificationSettings,
  type NotificationSettings 
} from '../mock/settingsData';
import { useAuth } from '../../../contexts/AuthContext';

interface NotificationsSectionProps {
  onSave?: () => void;
}

export function NotificationsSection({ onSave }: NotificationsSectionProps) {
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(loadNotificationSettings());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const original = loadNotificationSettings();
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(original));
  }, [settings]);

  const handleSave = () => {
    saveNotificationSettings(settings);
    setHasChanges(false);
    showToast('Notification settings saved successfully', 'success');
    onSave?.();
  };

  const handleReset = () => {
    const original = loadNotificationSettings();
    setSettings(original);
    setHasChanges(false);
    showToast('Settings reset to saved values', 'info');
  };

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Defect Alerts</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.defectAlerts.unsafeCreated}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defectAlerts: { ...prev.defectAlerts, unsafeCreated: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Unsafe defect created</span>
                  <p className="text-xs text-gray-500 mt-1">Receive alerts when a defect is marked as unsafe/do not use</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.defectAlerts.overdueDefects}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defectAlerts: { ...prev.defectAlerts, overdueDefects: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Overdue defects</span>
                  <p className="text-xs text-gray-500 mt-1">Receive alerts when defects pass their target rectification date</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.defectAlerts.highSeverityCreated}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defectAlerts: { ...prev.defectAlerts, highSeverityCreated: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">High severity defect created</span>
                  <p className="text-xs text-gray-500 mt-1">Receive alerts when defects with High or Critical severity are created</p>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Alerts</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.inspectionAlerts.overdueInspections}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    inspectionAlerts: { ...prev.inspectionAlerts, overdueInspections: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Overdue inspections</span>
                  <p className="text-xs text-gray-500 mt-1">Receive alerts when inspections pass their due date</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.inspectionAlerts.failedInspections}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    inspectionAlerts: { ...prev.inspectionAlerts, failedInspections: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Failed inspections</span>
                  <p className="text-xs text-gray-500 mt-1">Receive alerts when inspections are completed with failures</p>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Methods</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.deliveryMethods.inApp}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    deliveryMethods: { ...prev.deliveryMethods, inApp: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">In-app notifications</span>
                  <p className="text-xs text-gray-500 mt-1">Show notifications within the application</p>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={settings.deliveryMethods.email}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    deliveryMethods: { ...prev.deliveryMethods, email: e.target.checked }
                  }))}
                  disabled={!canEdit}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Email notifications</span>
                  <p className="text-xs text-gray-500 mt-1">Send notifications via email (coming soon)</p>
                </div>
              </label>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
                Save Settings
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                Reset
              </Button>
            </div>
          )}

          {!canEdit && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                You can view notification settings but cannot modify them. Contact an administrator for changes.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}


