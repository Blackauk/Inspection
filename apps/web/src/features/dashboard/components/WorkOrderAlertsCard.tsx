import { useNavigate } from 'react-router-dom';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { Badge } from '../../../components/common/Badge';
import { getWorkOrderAlerts } from '../../work-orders/services';
import type { WorkOrder } from '../../work-orders/types';

export function WorkOrderAlertsCard() {
  const navigate = useNavigate();
  const alerts = getWorkOrderAlerts();
  
  // Group alerts by type
  const overdueAlerts = alerts.filter((wo) => {
    if (!wo.dueDate) return false;
    const today = new Date();
    return new Date(wo.dueDate) < today && 
           wo.status !== 'Completed' && 
           wo.status !== 'ApprovedClosed' && 
           wo.status !== 'Cancelled';
  });

  const criticalAlerts = alerts.filter((wo) => 
    wo.priority === 'Critical' && 
    wo.status !== 'Completed' && 
    wo.status !== 'ApprovedClosed'
  );

  const waitingPartsAlerts = alerts.filter((wo) => wo.status === 'WaitingParts');

  const handleNavigateToOverdue = () => {
    navigate('/work-orders', { 
      state: { 
        activeWildcard: 'overdue'
      } 
    });
  };

  const handleNavigateToCritical = () => {
    navigate('/work-orders', { 
      state: { 
        activeWildcard: 'critical'
      } 
    });
  };

  const handleNavigateToWaitingParts = () => {
    navigate('/work-orders', { 
      state: { 
        activeWildcard: 'waiting-parts'
      } 
    });
  };

  const handleAlertClick = (wo: WorkOrder) => {
    navigate(`/work-orders/${wo.id}`);
  };

  return (
    <CollapsibleCard
      title="Work Order Alerts"
      storageKey="dashboard-wo-alerts"
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
              {overdueAlerts.slice(0, 5).map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(wo)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-medium text-gray-900">{wo.id}</span>
                    <Badge variant="error" size="sm">Overdue</Badge>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{wo.title}</div>
                  <div className="text-xs text-gray-700 mt-1">
                    {wo.assetTypeCode} {wo.assetId} • {wo.siteName}
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

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer hover:text-red-600 transition-colors"
              onClick={handleNavigateToCritical}
            >
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full" />
                Critical ({criticalAlerts.length})
              </h3>
              <span className="text-xs text-gray-500 hover:text-red-600">View all</span>
            </div>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 5).map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(wo)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-medium">{wo.id}</span>
                    <Badge variant="error" size="sm">Critical</Badge>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{wo.title}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {wo.assetTypeCode} {wo.assetId} • {wo.siteName}
                  </div>
                </div>
              ))}
              {criticalAlerts.length > 5 && (
                <button
                  onClick={handleNavigateToCritical}
                  className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2"
                >
                  +{criticalAlerts.length - 5} more critical
                </button>
              )}
            </div>
          </div>
        )}

        {/* Waiting Parts Alerts */}
        {waitingPartsAlerts.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer hover:text-amber-600 transition-colors"
              onClick={handleNavigateToWaitingParts}
            >
              <h3 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-600 rounded-full" />
                Waiting Parts ({waitingPartsAlerts.length})
              </h3>
              <span className="text-xs text-gray-500 hover:text-amber-600">View all</span>
            </div>
            <div className="space-y-2">
              {waitingPartsAlerts.slice(0, 5).map((wo) => (
                <div
                  key={wo.id}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(wo)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-sm font-medium">{wo.id}</span>
                    <Badge variant="warning" size="sm">Waiting Parts</Badge>
                  </div>
                  <div className="text-sm text-gray-900 font-medium">{wo.title}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {wo.assetTypeCode} {wo.assetId} • {wo.siteName}
                  </div>
                </div>
              ))}
              {waitingPartsAlerts.length > 5 && (
                <button
                  onClick={handleNavigateToWaitingParts}
                  className="w-full text-sm text-amber-600 hover:text-amber-700 font-medium py-2"
                >
                  +{waitingPartsAlerts.length - 5} more waiting parts
                </button>
              )}
            </div>
          </div>
        )}

        {/* No alerts state */}
        {alerts.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No work order alerts
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}

