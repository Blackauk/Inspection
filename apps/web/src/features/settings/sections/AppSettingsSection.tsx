import { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Button } from '../../../components/common/Button';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { showToast } from '../../../components/common/Toast';
import { loadAppSettings, saveAppSettings, loadSites, type AppSettings } from '../mock/settingsData';

interface AppSettingsSectionProps {
  onSave?: () => void;
}

export function AppSettingsSection({ onSave }: AppSettingsSectionProps) {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const sites = loadSites();

  useEffect(() => {
    const original = loadAppSettings();
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(original));
  }, [settings]);

  const handleSave = () => {
    saveAppSettings(settings);
    setHasChanges(false);
    showToast('App settings saved successfully', 'success');
    onSave?.();
  };

  const handleReset = () => {
    const original = loadAppSettings();
    setSettings(original);
    setHasChanges(false);
    showToast('Settings reset to saved values', 'info');
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="App Name"
                value={settings.appName}
                onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
              />
              
              <Select
                label="Default Timezone"
                value={settings.defaultTimezone}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTimezone: e.target.value }))}
                options={[
                  { value: 'Europe/London', label: 'Europe/London (GMT)' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
                  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
                  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
                ]}
              />
              
              <Select
                label="Date Format"
                value={settings.dateFormat}
                onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY' }))}
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                ]}
              />
              
              <Select
                label="Default Site"
                value={settings.defaultSiteId || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultSiteId: e.target.value || undefined }))}
                options={[
                  { value: '', label: 'None' },
                  ...sites.filter(s => s.status === 'Active').map(site => ({ value: site.id, label: site.name })),
                ]}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Module Toggles</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.modules.workOrders}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    modules: { ...prev.modules, workOrders: e.target.checked }
                  }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Work Orders</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.modules.pmSchedules}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    modules: { ...prev.modules, pmSchedules: e.target.checked }
                  }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">PM Schedules</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.modules.reports}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    modules: { ...prev.modules, reports: e.target.checked }
                  }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Reports</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Defects Behavior</h3>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.defects.autoCreateOnInspectionFail}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defects: { ...prev.defects, autoCreateOnInspectionFail: e.target.checked }
                }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Auto-create defect when inspection item fails</span>
                <p className="text-xs text-gray-500 mt-1">Automatically create a defect record when an inspection item is marked as failed</p>
              </div>
            </label>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Inspections Behavior</h3>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.inspections.autoCloseOnAllPass}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  inspections: { ...prev.inspections, autoCloseOnAllPass: e.target.checked }
                }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Auto-close inspection if all items pass</span>
                <p className="text-xs text-gray-500 mt-1">Automatically close inspections when all checklist items are marked as pass</p>
              </div>
            </label>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
              Save Settings
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <CollapsibleCard
        title="Advanced Settings"
        defaultExpanded={false}
        storageKey="settings-advanced"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Advanced configuration options will be available here in a future update.
          </p>
        </div>
      </CollapsibleCard>
    </div>
  );
}


