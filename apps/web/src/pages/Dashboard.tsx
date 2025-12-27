import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

interface DashboardStats {
  overdue: number;
  due7Days: number;
  openBreakdowns: number;
  outOfUse: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get due occurrences
      const occurrences = await api.get<any[]>('/check-occurrences/due?days=7');
      const overdue = occurrences.filter(
        (o) => new Date(o.dueDate) < new Date() && !o.isCompleted
      ).length;
      const due7Days = occurrences.filter((o) => !o.isCompleted).length;

      // Get open breakdowns
      const workOrders = await api.get<any>('/work-orders?status=Open&type=Breakdown&limit=100');
      const openBreakdowns = workOrders.pagination?.total || 0;

      // Get out of use assets
      const assets = await api.get<any>('/assets?status=OutOfUse&limit=100');
      const outOfUse = assets.pagination?.total || 0;

      setStats({
        overdue,
        due7Days,
        openBreakdowns,
        outOfUse,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/checks"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">{stats?.overdue || 0}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue Checks
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/checks"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">{stats?.due7Days || 0}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Due in 7 Days
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/work-orders?type=Breakdown&status=Open"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">
                    {stats?.openBreakdowns || 0}
                  </span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Open Breakdowns
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/assets?status=OutOfUse"
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold">{stats?.outOfUse || 0}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Out of Use
                  </dt>
                </dl>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}


