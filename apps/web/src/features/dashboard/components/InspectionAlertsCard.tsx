import { useNavigate } from 'react-router-dom';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { Badge } from '../../../components/common/Badge';
import { getInspectionAlerts } from '../../inspections/services';
import type { Inspection } from '../../inspections/types';

export function InspectionAlertsCard() {
  const navigate = useNavigate();
  const alerts = getInspectionAlerts();
  
  // Group alerts by type
  const overdueAlerts = alerts.filter((ins) => {
    if (!ins.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(ins.dueDate) < today && 
           ins.status !== 'Closed' && 
           ins.status !== 'Approved';
  });

  const failedAlerts = alerts.filter((ins) => 
    ins.result === 'Fail' && 
    ins.status !== 'Closed' && 
    ins.status !== 'Approved'
  );

  const dueSoonAlerts = alerts.filter((ins) => {
    if (!ins.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date(ins.dueDate) >= today &&
           new Date(ins.dueDate) <= nextWeek &&
           ins.status !== 'Closed' && 
           ins.status !== 'Approved';
  });

  const handleNavigateToOverdue = () => {
    navigate('/inspections', { 
      state: { 
        activeQuickFilter: 'overdue'
      } 
    });
  };

  const handleNavigateToFailed = () => {
    navigate('/inspections', { 
      state: { 
        activeQuickFilter: 'failed'
      } 
    });
  };

  const handleNavigateToDueSoon = () => {
    navigate('/inspections', { 
      state: { 
        showDueSoon: true
      } 
    });
  };

  const handleAlertClick = (ins: Inspection) => {
    navigate(`/inspections/${ins.id}/checklist`);
  };

  return (
    <CollapsibleCard
      title="Inspection Alerts"
      storageKey="dashboard-inspection-alerts"
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {/* Overdue Alerts */}
        {overdueAlerts.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer hover:text-red-600 transition-colors"
              onClick={handleNavigateToOverdue}
            >
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full" />
                Overdue ({overdueAlerts.length})
              </h3>
              <span className="text-xs text-gray-500 hover:text-red-600">View all</span>
            </div>
            <div className="space-y-2">
              {overdueAlerts.slice(0, 5).map((ins) => (
                <div
                  key={ins.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(ins)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{ins.inspectionCode}</span>
                    <Badge variant="error" size="sm">Overdue</Badge>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{ins.templateName}</div>
                  <div className="text-xs text-gray-700 mt-1">
                    {ins.assetId || 'No asset'} • {ins.siteName || 'No site'}
                  </div>
                </div>
              ))}
              {overdueAlerts.length > 5 && (
                <button
                  onClick={handleNavigateToOverdue}
                  className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2"
                >
                  +{overdueAlerts.length - 5} more overdue
                </button>
              )}
            </div>
          </div>
        )}

        {/* Failed Alerts */}
        {failedAlerts.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer hover:text-red-600 transition-colors"
              onClick={handleNavigateToFailed}
            >
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full" />
                Failed ({failedAlerts.length})
              </h3>
              <span className="text-xs text-gray-500 hover:text-red-600">View all</span>
            </div>
            <div className="space-y-2">
              {failedAlerts.slice(0, 5).map((ins) => (
                <div
                  key={ins.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(ins)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{ins.inspectionCode}</span>
                    <Badge variant="error" size="sm">Failed</Badge>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{ins.templateName}</div>
                  <div className="text-xs text-gray-700 mt-1">
                    {ins.assetId || 'No asset'} • {ins.siteName || 'No site'}
                  </div>
                </div>
              ))}
              {failedAlerts.length > 5 && (
                <button
                  onClick={handleNavigateToFailed}
                  className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2"
                >
                  +{failedAlerts.length - 5} more failed
                </button>
              )}
            </div>
          </div>
        )}

        {/* Due Soon Alerts */}
        {dueSoonAlerts.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer hover:text-amber-600 transition-colors"
              onClick={handleNavigateToDueSoon}
            >
              <h3 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-600 rounded-full" />
                Due Soon ({dueSoonAlerts.length})
              </h3>
              <span className="text-xs text-gray-500 hover:text-amber-600">View all</span>
            </div>
            <div className="space-y-2">
              {dueSoonAlerts.slice(0, 5).map((ins) => (
                <div
                  key={ins.id}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(ins)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{ins.inspectionCode}</span>
                    <Badge variant="warning" size="sm">Due Soon</Badge>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{ins.templateName}</div>
                  <div className="text-xs text-gray-700 mt-1">
                    {ins.assetId || 'No asset'} • {ins.siteName || 'No site'}
                  </div>
                </div>
              ))}
              {dueSoonAlerts.length > 5 && (
                <button
                  onClick={handleNavigateToDueSoon}
                  className="w-full text-sm text-amber-600 hover:text-amber-700 font-medium py-2"
                >
                  +{dueSoonAlerts.length - 5} more due soon
                </button>
              )}
            </div>
          </div>
        )}

        {/* No alerts state */}
        {alerts.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No inspection alerts
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}

