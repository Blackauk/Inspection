import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AppShell } from '../layouts/AppShell';

// Main
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';

// Operations
import { AssetsPage } from '../../features/assets/pages/AssetsPage';
import { AssetDetailPage } from '../../features/assets/pages/AssetDetailPage';
import { WorkOrdersListPage } from '../../features/work-orders/pages/WorkOrdersListPage';
import { WorkOrderDetailPage } from '../../features/work-orders/pages/WorkOrderDetailPage';
import { PMSchedulesListPage } from '../../features/pm-schedules/pages/PMSchedulesListPage';
import { PMScheduleDetailPage } from '../../features/pm-schedules/pages/PMScheduleDetailPage';
import { InspectionsPage } from '../../features/inspections/pages/InspectionsPage';
import { InspectionsListPage } from '../../features/inspections/pages/InspectionsListPage';
import { InspectionDetailPage } from '../../features/inspections/pages/InspectionDetailPage';
import { InspectionFormPage } from '../../features/inspections/pages/InspectionFormPage';
import { StartInspectionPage } from '../../features/inspections/pages/StartInspectionPage';
import { InspectionRunnerPage } from '../../features/inspections/pages/InspectionRunnerPage';
import { CreateTemplatePage } from '../../features/inspections/pages/CreateTemplatePage';
import { TemplateEditorPage } from '../../features/inspections/pages/TemplateEditorPage';
import { CheckSheetsListPage } from '../../features/inspections/pages/CheckSheetsListPage';
import { ChecklistsListPage } from '../../features/inspections/pages/ChecklistsListPage';
import { ChecklistViewPage } from '../../features/inspections/pages/ChecklistViewPage';
import { DefectsListPage } from '../../features/defects/pages/DefectsListPage';
import { DefectDetailPage } from '../../features/defects/pages/DefectDetailPage';
import { DefectFormPage } from '../../features/defects/pages/DefectFormPage';
import { HandoversListPage } from '../../features/handovers/pages/HandoversListPage';
import { HandoverViewPage } from '../../features/handovers/pages/HandoverViewPage';
import { MasterHandoverViewPage } from '../../features/handovers/pages/MasterHandoverViewPage';
import { HandoverSubmittedPage } from '../../features/handovers/pages/HandoverSubmittedPage';

// Intelligence
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { AuditLogPage } from '../../features/audit-log/pages/AuditLogPage';

// Admin
import { UsersPage } from '../../features/users/pages/UsersPage';
import { SitesPage } from '../../features/sites/pages/SitesPage';
import { SiteDetailPage } from '../../features/sites/pages/SiteDetailPage';
import { SiteFormPage } from '../../features/sites/pages/SiteFormPage';
import { LocationFormPage } from '../../features/sites/pages/LocationFormPage';
import { CategoriesPage } from '../../features/categories/pages/CategoriesPage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';

// Support
import { HelpPage } from '../../features/help/pages/HelpPage';

// Legacy/Other
import Login from '../../pages/Login';
import Health from '../../pages/Health';

export function AppRoutes() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.tsx:42',message:'AppRoutes render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  try {
    return (
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/health" element={<Health />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Main */}
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Operations */}
        <Route path="assets" element={<AssetsPage />} />
        <Route path="assets/:id" element={<AssetDetailPage />} />
        <Route path="work-orders" element={<WorkOrdersListPage />} />
        <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="pm-schedules" element={<PMSchedulesListPage />} />
        <Route path="pm-schedules/:id" element={<PMScheduleDetailPage />} />
        <Route path="inspections" element={<InspectionsListPage />} />
        <Route path="inspections/start" element={<StartInspectionPage />} />
        <Route path="inspections/run/:id" element={<InspectionRunnerPage />} />
        <Route path="inspections/create" element={<CreateTemplatePage />} />
        <Route path="inspections/templates/:id/edit" element={<TemplateEditorPage />} />
        <Route path="inspections/new" element={<InspectionFormPage />} />
        <Route path="inspections/:id/checklist" element={<ChecklistViewPage />} />
        <Route path="inspections/:id" element={<InspectionDetailPage />} />
        <Route path="inspections/templates" element={<InspectionsPage />} />
        <Route path="inspections/templates/:id" element={<CheckSheetsListPage />} />
        <Route path="inspections/checklists" element={<InspectionsPage />} />
        <Route path="inspections/checklists/:id" element={<ChecklistsListPage />} />
        <Route path="defects" element={<DefectsListPage />} />
        <Route path="defects/new" element={<DefectFormPage />} />
        <Route path="defects/:id" element={<DefectDetailPage />} />
        <Route path="handovers" element={<HandoversListPage />} />
        <Route path="handovers/submitted/:id" element={<HandoverSubmittedPage />} />
        <Route path="handovers/:id" element={<HandoverViewPage />} />
        <Route path="handovers/:id/edit" element={<HandoverViewPage />} />
        <Route path="handovers/master/:id" element={<MasterHandoverViewPage />} />
        
        {/* Intelligence */}
        <Route path="reports" element={<ReportsPage />} />
        
        {/* Settings (includes all admin pages as sections) */}
        <Route path="settings/*" element={<SettingsPage />} />
        
        {/* Admin routes (still accessible, but not in sidebar) */}
        <Route path="users" element={<UsersPage />} />
        <Route path="sites" element={<SitesPage />} />
        <Route path="sites/new" element={<SiteFormPage />} />
        <Route path="sites/:id" element={<SiteDetailPage />} />
        <Route path="sites/:id/edit" element={<SiteFormPage />} />
        <Route path="sites/:siteId/locations/new" element={<LocationFormPage />} />
        <Route path="sites/:siteId/locations/:id/edit" element={<LocationFormPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        
        {/* Support */}
        <Route path="help" element={<HelpPage />} />
      </Route>
    </Routes>
    );
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/107c67e1-b121-4ce5-b267-7a0a6dafd4f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/index.tsx:95',message:'AppRoutes render error',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('AppRoutes render error:', error);
    return <div>Routes Error: {error instanceof Error ? error.message : String(error)}</div>;
  }
}
