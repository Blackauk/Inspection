import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { PageHeader } from '../../../components/common/PageHeader';
import { SettingsMenu } from '../components/SettingsMenu';
import { SettingsOverview } from '../components/SettingsOverview';
import { AppSettingsSection } from '../sections/AppSettingsSection';
import { UsersRolesSection } from '../sections/UsersRolesSection';
import { SitesLocationsSection } from '../sections/SitesLocationsSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { TagsSection } from '../sections/TagsSection';
import { AuditLogSection } from '../sections/AuditLogSection';
import { NotificationsSection } from '../sections/NotificationsSection';
import { PDFBrandingSection } from '../sections/PDFBrandingSection';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';

export function SettingsPage() {
  const location = useLocation();
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Remember last selected section
  useEffect(() => {
    if (location.pathname !== '/settings' && location.pathname !== '/settings/') {
      localStorage.setItem('settings-last-section', location.pathname);
    }
  }, [location.pathname]);

  const getDefaultPath = () => {
    const saved = localStorage.getItem('settings-last-section');
    return saved || '/settings/overview';
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Settings"
        subtitle="Manage system configuration and administration"
        actions={
          lastSaved && (
            <span className="text-sm text-gray-500">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )
        }
      />

      <div className="mt-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Left Menu */}
          <div>
            <div className="lg:sticky lg:top-24">
              <SettingsMenu />
            </div>
          </div>

          {/* Right Content */}
          <div>
            <ErrorBoundary
              fallback={({ error, resetError }) => (
                <Card>
                  <div className="p-6">
                    <div className="text-center py-8">
                      <h3 className="text-lg font-semibold text-red-600 mb-2">Settings Section Error</h3>
                      <p className="text-gray-600 mb-4">
                        This settings section encountered an error. You can try again or navigate to another section.
                      </p>
                      {error && (
                        <details className="text-left mb-4 p-3 bg-gray-50 rounded text-sm">
                          <summary className="cursor-pointer text-gray-700 font-medium">Error Details</summary>
                          <pre className="mt-2 text-xs text-red-600 overflow-auto">{error.message || String(error)}</pre>
                        </details>
                      )}
                      <div className="flex gap-2 justify-center">
                        <Button onClick={resetError} variant="primary">
                          Try Again
                        </Button>
                        <Button onClick={() => window.location.href = '/settings/overview'} variant="outline">
                          Go to Overview
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            >
              <Routes>
                <Route index element={<Navigate to={getDefaultPath()} replace />} />
                <Route path="overview" element={<SettingsOverview />} />
                <Route path="app-settings" element={<AppSettingsSection onSave={() => setLastSaved(new Date().toISOString())} />} />
                <Route path="users" element={<UsersRolesSection />} />
                <Route path="sites" element={<SitesLocationsSection />} />
                <Route path="categories" element={<CategoriesSection />} />
                <Route path="tags" element={<TagsSection />} />
                <Route path="audit-log" element={<AuditLogSection />} />
                <Route path="notifications" element={<NotificationsSection onSave={() => setLastSaved(new Date().toISOString())} />} />
                <Route path="pdf-branding" element={<PDFBrandingSection />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
