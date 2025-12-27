import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getDisplayName } from '../../../utils/userUtils';
import { Card } from '../../../components/common/Card';
import { StatCard } from '../../../components/common/StatCard';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { WorkOrdersStatusDonut } from '../components/WorkOrdersStatusDonut';
import { WorkOrderTrendsChart } from '../components/WorkOrderTrendsChart';
import { DashboardDateFilter } from '../components/DashboardDateFilter';
import { WorkOrderAlertsCard } from '../components/WorkOrderAlertsCard';
import { InspectionAlertsCard } from '../components/InspectionAlertsCard';
import { DefectAlertsCard } from '../components/DefectAlertsCard';
import type { DateRange } from '../utils/dateRange';
import { Building2, Clock, ClipboardList, Shield, XCircle, AlertTriangle } from 'lucide-react';
import {
  getKPIStats,
  getNotifications,
  getComplianceSnapshot,
  getDueSoonItems,
  getTopProblemAssets,
  getCategoryBreakdown,
  getRecentActivity,
  getWorkOrdersByStatus,
  getWorkOrderTrends,
} from '../services';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dueSoonDays, setDueSoonDays] = useState<7 | 14 | 30>(7);
  // Default to "This month (to date)" for all date filters
  const [workOrderTrendsRange, setWorkOrderTrendsRange] = useState<DateRange>({ preset: 'mtd' });
  const [workOrderStatusRange, setWorkOrderStatusRange] = useState<DateRange>({ preset: 'mtd' });
  const [topProblemAssetsRange, setTopProblemAssetsRange] = useState<DateRange>({ preset: 'mtd' });
  const [defectsCategoryRange, setDefectsCategoryRange] = useState<DateRange>({ preset: 'mtd' });

  const kpiStats = getKPIStats();
  const notifications = getNotifications();
  const complianceSnapshot = getComplianceSnapshot();
  const dueSoonItems = getDueSoonItems(dueSoonDays);
  const problemAssets = getTopProblemAssets();
  const categoryBreakdown = getCategoryBreakdown();
  const recentActivity = getRecentActivity();
  // Convert DateRange to legacy format for trends (will update service later)
  const trendDays = workOrderTrendsRange.preset === '7d' ? 7 : workOrderTrendsRange.preset === '14d' ? 14 : 30;
  const trendData = getWorkOrderTrends(trendDays);
  
  // Work orders by status now accepts DateRange directly
  const workOrdersByStatus = getWorkOrdersByStatus(workOrderStatusRange);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'success':
        return '🟢';
      default:
        return '🔵';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Greeting Card */}
      <Card>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {getDisplayName(user)} 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiStats.map((stat) => {
          // Map icon based on stat ID
          const iconMap: Record<string, typeof Building2> = {
            '1': Building2, // Total Assets
            '2': Clock, // Overdue PMs
            '3': ClipboardList, // Open Work Orders
            '4': Shield, // Compliance Expiring
            '5': XCircle, // Failed Inspections
            '6': AlertTriangle, // High-Risk Assets
          };

          return (
            <StatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              badge={stat.badge}
              badgeVariant={stat.badgeVariant}
              icon={iconMap[stat.id]}
              showViewLink
              onClick={() => {
                // Navigate to relevant page based on stat
                if (stat.id === '1') navigate('/assets');
                if (stat.id === '2') navigate('/pm-schedules?filter=overdue');
                if (stat.id === '3') navigate('/work-orders?priority=High&status=Open');
                if (stat.id === '4') navigate('/inspections?filter=expiring');
                if (stat.id === '5') navigate('/inspections?status=Failed');
                if (stat.id === '6') navigate('/assets?filter=high-risk');
              }}
            />
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart Card */}
          <CollapsibleCard
            title="Work Order Trends"
            storageKey="dashboard-work-order-trends"
            defaultExpanded={true}
            actions={
              <DashboardDateFilter
                value={workOrderTrendsRange}
                onChange={setWorkOrderTrendsRange}
              />
            }
          >
            <div>
              <p className="text-xs text-gray-500 mb-4">
                Daily work orders created
              </p>
              <WorkOrderTrendsChart data={trendData} />
            </div>
          </CollapsibleCard>

          {/* Top Problem Assets */}
          <CollapsibleCard
            title="Top Problem Assets"
            storageKey="dashboard-top-problem-assets"
            defaultExpanded={true}
            actions={
              <DashboardDateFilter
                value={topProblemAssetsRange}
                onChange={setTopProblemAssetsRange}
              />
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Asset</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Issues</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {problemAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{asset.assetCode}</div>
                        <div className="text-sm text-gray-500">{asset.assetName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="error">{asset.issues}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{asset.lastIssue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleCard>

          {/* Due Soon with Tabs */}
          <CollapsibleCard
            title="Due Soon"
            storageKey="dashboard-due-soon"
            defaultExpanded={true}
            actions={
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {([7, 14, 30] as const).map((days) => (
                  <Button
                    key={days}
                    size="sm"
                    variant={dueSoonDays === days ? 'primary' : 'outline'}
                    onClick={() => setDueSoonDays(days)}
                  >
                    {days} days
                  </Button>
                ))}
              </div>
            }
          >
            <div className="space-y-2">
              {dueSoonItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={item.type === 'pm' ? 'info' : 'warning'}>
                        {item.type.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.assetName} • {item.site} • {item.daysUntil} day{item.daysUntil !== 1 ? 's' : ''} until due
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Distribution Chart */}
          <CollapsibleCard
            title="Work Orders by Status"
            storageKey="dashboard-work-orders-status"
            defaultExpanded={true}
            actions={
              <DashboardDateFilter
                value={workOrderStatusRange}
                onChange={setWorkOrderStatusRange}
              />
            }
          >
            <WorkOrdersStatusDonut data={workOrdersByStatus} />
          </CollapsibleCard>

          {/* Defects by Category - Moved from right column for balance */}
          <CollapsibleCard
            title="Defects by Category"
            storageKey="dashboard-defects-category"
            defaultExpanded={true}
            actions={
              <DashboardDateFilter
                value={defectsCategoryRange}
                onChange={setDefectsCategoryRange}
              />
            }
          >
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm text-gray-600">{cat.count} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        </div>

        {/* Right Column - Info Rail */}
        <div className="lg:col-span-4 space-y-6">
          {/* Work Order Alerts */}
          <WorkOrderAlertsCard />

          {/* Inspection Alerts */}
          <InspectionAlertsCard />

          {/* Defect Alerts */}
          <DefectAlertsCard />

          {/* Site Summary */}
          <CollapsibleCard title="Site Summary" storageKey="dashboard-site-summary" defaultExpanded={true}>
            <div className="space-y-4">
              {complianceSnapshot.map((site) => (
                <div key={site.siteId} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">{site.siteName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-gray-500">Assets:</span>
                      <span className="ml-2 font-medium text-gray-900">{site.totalAssets}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Overdue PM:</span>
                      <span className="ml-2 font-medium text-red-600">{site.overduePM}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Open WOs:</span>
                      <span className="ml-2 font-medium text-gray-900">{site.openWorkOrders}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Compliance Red:</span>
                      <span className="ml-2 font-medium text-red-600">{site.complianceRed}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500"
                      style={{ width: `${(site.green / (site.green + site.amber + site.red)) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${(site.amber / (site.green + site.amber + site.red)) * 100}%` }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${(site.red / (site.green + site.amber + site.red)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleCard>

          {/* Recent Activity */}
          <CollapsibleCard title="Recent Activity" storageKey="dashboard-recent-activity" defaultExpanded={true}>
            {recentActivity.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Activity will appear here as users perform actions</p>
              </div>
            ) : (
              <div className="min-h-[200px] max-h-[480px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Time</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Description</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Entity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((activity) => (
                        <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-xs text-gray-500">{activity.timestamp}</td>
                          <td className="py-2 px-3 text-sm text-gray-900">
                            <span className="font-medium">{activity.user}</span>{' '}
                            <span className="text-gray-600">{activity.action}</span>
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="info" size="sm">
                              {activity.entity}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CollapsibleCard>

        </div>
      </div>
    </div>
  );
}
