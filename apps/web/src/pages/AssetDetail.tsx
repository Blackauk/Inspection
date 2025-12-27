import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAsset();
    }
  }, [id]);

  async function loadAsset() {
    try {
      const data = await api.get(`/assets/${id}`);
      setAsset(data);
    } catch (error) {
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!asset) {
    return <div className="text-center py-8">Asset not found</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {asset.code} - {asset.name}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{asset.assetType.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{asset.category}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ownership</dt>
              <dd className="mt-1 text-sm text-gray-900">{asset.ownership}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{asset.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Site</dt>
              <dd className="mt-1 text-sm text-gray-900">{asset.site.name}</dd>
            </div>
          </dl>
          {asset.description && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{asset.description}</dd>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Open Work Orders</h2>
          {asset.workOrders && asset.workOrders.length > 0 ? (
            <ul className="space-y-2">
              {asset.workOrders.map((wo: any) => (
                <li key={wo.id} className="border-b pb-2">
                  <a
                    href={`/work-orders/${wo.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {wo.number} - {wo.title}
                  </a>
                  <span className="ml-2 text-sm text-gray-500">{wo.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No open work orders</p>
          )}
        </div>
      </div>
    </div>
  );
}


