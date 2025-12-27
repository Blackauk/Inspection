import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { FrequenciesSection } from '../features/settings/components/FrequenciesSection';

interface AssetType {
  id: string;
  name: string;
  prefix: string;
}

interface Site {
  id: string;
  name: string;
  project: {
    name: string;
    company: {
      name: string;
    };
  };
}

export default function Settings() {
  const { user } = useAuth();
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPrefix, setNewPrefix] = useState({ name: '', prefix: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrefix, setEditPrefix] = useState({ name: '', prefix: '' });

  useEffect(() => {
    if (user?.role === 'Admin') {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      const [types, sitesData] = await Promise.all([
        api.get<AssetType[]>('/asset-types'),
        api.get<Site[]>('/sites'),
      ]);
      setAssetTypes(types);
      setSites(sitesData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createAssetType() {
    try {
      await api.post('/asset-types', newPrefix);
      setNewPrefix({ name: '', prefix: '' });
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to create asset type');
    }
  }

  async function updateAssetType(id: string) {
    try {
      await api.put(`/asset-types/${id}`, editPrefix);
      setEditing(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to update asset type');
    }
  }

  async function deleteAssetType(id: string) {
    if (!confirm('Are you sure you want to delete this asset type?')) {
      return;
    }
    try {
      await api.delete(`/asset-types/${id}`);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete asset type');
    }
  }

  if (user?.role !== 'Admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Access denied. Admin only.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Asset Type Prefixes */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Asset Type Prefixes</h2>
        
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Asset Type Name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              value={newPrefix.name}
              onChange={(e) => setNewPrefix({ ...newPrefix, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Prefix (e.g., TBM)"
              className="w-32 border border-gray-300 rounded-md px-3 py-2 uppercase"
              value={newPrefix.prefix}
              onChange={(e) => setNewPrefix({ ...newPrefix, prefix: e.target.value.toUpperCase() })}
              maxLength={10}
            />
            <button
              onClick={createAssetType}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Prefix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assetTypes.map((type) => (
              <tr key={type.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editing === type.id ? (
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md px-2 py-1 w-full"
                      value={editPrefix.name}
                      onChange={(e) => setEditPrefix({ ...editPrefix, name: e.target.value })}
                    />
                  ) : (
                    type.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editing === type.id ? (
                    <input
                      type="text"
                      className="border border-gray-300 rounded-md px-2 py-1 w-24 uppercase"
                      value={editPrefix.prefix}
                      onChange={(e) => setEditPrefix({ ...editPrefix, prefix: e.target.value.toUpperCase() })}
                      maxLength={10}
                    />
                  ) : (
                    <span className="font-mono">{type.prefix}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editing === type.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateAssetType(type.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(type.id);
                          setEditPrefix({ name: type.name, prefix: type.prefix });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAssetType(type.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Frequencies & Intervals */}
      <FrequenciesSection />

      {/* Sites */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Sites</h2>
        <div className="space-y-2">
          {sites.map((site) => (
            <div key={site.id} className="border-b pb-2">
              <div className="font-medium">{site.name}</div>
              <div className="text-sm text-gray-600">
                {site.project.company.name} → {site.project.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}















