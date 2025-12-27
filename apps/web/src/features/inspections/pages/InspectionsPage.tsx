import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '../../../components/common/Tabs';
import { InspectionsListPage } from './InspectionsListPage';
import { CheckSheetsListPage } from './CheckSheetsListPage';
import { ChecklistsListPage } from './ChecklistsListPage';

export function InspectionsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const activeTab = location.pathname.includes('/templates')
    ? 'check-sheets'
    : location.pathname.includes('/checklists')
    ? 'checklists'
    : 'inspections';

  const handleTabChange = (tabId: string) => {
    if (tabId === 'check-sheets') {
      navigate('/inspections/templates');
    } else if (tabId === 'checklists') {
      navigate('/inspections/checklists');
    } else {
      navigate('/inspections');
    }
  };

  // Render content based on active tab
  if (activeTab === 'check-sheets') {
    return <CheckSheetsListPage />;
  }
  if (activeTab === 'checklists') {
    return <ChecklistsListPage />;
  }

  // Default: Inspections
  return <InspectionsListPage />;
}
