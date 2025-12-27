import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface Asset {
  id: string;
  code: string;
  name: string;
  assetType: { name: string };
  site: { name: string };
  status: string;
  category: string;
}

export default function Assets() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    siteId: '',
    assetTypeId: '',
    status: '',
    category: '',
  });

  useEffect(() => {
    loadAssets();
  }, [filters]);

  async function loadAssets() {
    try {
      const params = new URLSearchParams();
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.assetTypeId) params.append('assetTypeId', filters.assetTypeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);

      const response = await api.get<any>(`/assets?${params.toString()}`);
      setAssets(response.data || []);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        {user?.role !== 'Viewer' && (
          <Link
            to="/assets/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-center"
          >
            Create Asset
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="InUse">In Use</option>
              <option value="OutOfUse">Out of Use</option>
              <option value="OffHirePending">Off Hire Pending</option>
              <option value="OffHired">Off Hired</option>
              <option value="Quarantined">Quarantined</option>
            </select>
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="Plant">Plant</option>
              <option value="Equipment">Equipment</option>
            </select>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <Link to={`/assets/${asset.id}`} className="text-blue-600 hover:text-blue-800">
                    {asset.code}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {asset.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.assetType.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.site.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      asset.status === 'InUse'
                        ? 'bg-green-100 text-green-800'
                        : asset.status === 'OutOfUse'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


