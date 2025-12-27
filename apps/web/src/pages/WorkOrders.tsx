import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { addToQueue } from '../utils/offlineQueue';
import { useOffline } from '../contexts/OfflineContext';

interface WorkOrder {
  id: string;
  number: string;
  type: string;
  status: string;
  title: string;
  priority: string;
  asset: { code: string; name: string };
  assignedTo: { firstName: string; lastName: string } | null;
}

export default function WorkOrders() {
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
  });

  useEffect(() => {
    loadWorkOrders();
  }, [filters]);

  async function loadWorkOrders() {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get<any>(`/work-orders?${params.toString()}`);
      setWorkOrders(response.data || []);
    } catch (error) {
      console.error('Failed to load work orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        {user?.role !== 'Viewer' && (
          <Link
            to="/work-orders/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Work Order
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="Breakdown">Breakdown</option>
              <option value="PPM">PPM</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workOrders.map((wo) => (
              <tr key={wo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Link to={`/work-orders/${wo.id}`} className="text-blue-600 hover:text-blue-800">
                    {wo.number}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{wo.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {wo.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {wo.asset.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      wo.status === 'Completed' || wo.status === 'ApprovedClosed'
                        ? 'bg-green-100 text-green-800'
                        : wo.status === 'Open'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {wo.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {wo.assignedTo
                    ? `${wo.assignedTo.firstName} ${wo.assignedTo.lastName}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


