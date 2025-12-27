import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { useDefects } from '../../defects/context/DefectsContext';

export function DefectAlertsCard() {
  const navigate = useNavigate();
  const { defects, loading } = useDefects();

  // Calculate counts for all metrics
  const counts = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Overdue Defects: Status = Open, Due date < today
    const overdueCount = defects.filter((d) => {
      if (d.status === 'Closed') return false;
      // Check if status is explicitly Overdue
      if (d.status === 'Overdue') return true;
      // Check if Open status with past due date
      if (d.status === 'Open' && d.targetRectificationDate) {
        const dueDate = new Date(d.targetRectificationDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < now;
      }
      return false;
    }).length;

    // Open Defects: Status = Open (not closed)
    const openCount = defects.filter((d) => {
      return d.status === 'Open';
    }).length;

    // In Progress Defects: Status = InProgress
    const inProgressCount = defects.filter((d) => {
      return d.status === 'InProgress';
    }).length;

    // Safety Critical Defects: Severity = Safety Critical, Status ≠ Closed
    // For MMC: Critical is safety critical
    // For LMH: High is safety critical
    const safetyCriticalCount = defects.filter((d) => {
      if (d.status === 'Closed') return false;
      if (d.severityModel === 'MMC') {
        return d.severity === 'Critical';
      }
      // For LMH model, High is safety critical
      return d.severity === 'High';
    }).length;

    return {
      overdue: overdueCount,
      open: openCount,
      inProgress: inProgressCount,
      safetyCritical: safetyCriticalCount,
    };
  }, [defects]);

  // Show 0s while loading
  const displayCounts = loading
    ? { overdue: 0, open: 0, inProgress: 0, safetyCritical: 0 }
    : counts;

  // Navigation handlers
  const handleNavigateToOverdue = () => {
    navigate('/defects?status=Open&overdue=true');
  };

  const handleNavigateToOpen = () => {
    navigate('/defects?status=Open');
  };

  const handleNavigateToInProgress = () => {
    navigate('/defects?status=InProgress');
  };

  const handleNavigateToSafetyCritical = () => {
    // Navigate with Critical (MMC) or High (LMH) severity filter
    navigate('/defects?status=Open&severity=Critical&severity=High');
  };

  return (
    <CollapsibleCard
      title="Defect Alerts"
      storageKey="dashboard-defect-alerts"
      defaultExpanded={true}
    >
      <div className="space-y-4">
        {/* Overdue Defects */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer hover:text-red-600 transition-colors"
            onClick={handleNavigateToOverdue}
          >
            <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full" />
              Overdue ({displayCounts.overdue})
            </h3>
            <span className="text-xs text-gray-500 hover:text-red-600">View all</span>
          </div>
        </div>

        {/* Open Defects */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer hover:text-gray-700 transition-colors"
            onClick={handleNavigateToOpen}
          >
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              Open ({displayCounts.open})
            </h3>
            <span className="text-xs text-gray-500 hover:text-gray-700">View all</span>
          </div>
        </div>

        {/* In Progress Defects */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer hover:text-amber-600 transition-colors"
            onClick={handleNavigateToInProgress}
          >
            <h3 className="text-sm font-semibold text-amber-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-600 rounded-full" />
              In Progress ({displayCounts.inProgress})
            </h3>
            <span className="text-xs text-gray-500 hover:text-amber-600">View all</span>
          </div>
        </div>

        {/* Safety Critical Defects */}
        <div>
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer hover:text-red-600 transition-colors"
            onClick={handleNavigateToSafetyCritical}
          >
            <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full" />
              Safety Critical ({displayCounts.safetyCritical})
            </h3>
            <span className="text-xs text-gray-500 hover:text-red-600">View all</span>
          </div>
        </div>

        {/* No alerts state - only show if all counts are 0 */}
        {displayCounts.overdue === 0 && displayCounts.open === 0 && displayCounts.inProgress === 0 && displayCounts.safetyCritical === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No defect alerts
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
