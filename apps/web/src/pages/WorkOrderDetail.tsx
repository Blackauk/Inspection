import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadWorkOrder();
    }
  }, [id]);

  async function loadWorkOrder() {
    try {
      const data = await api.get(`/work-orders/${id}`);
      setWorkOrder(data);
    } catch (error) {
      console.error('Failed to load work order:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string, notes?: string) {
    try {
      await api.patch(`/work-orders/${id}/status`, { status, notes });
      await loadWorkOrder();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!workOrder) {
    return <div className="text-center py-8">Work order not found</div>;
  }

  const canComplete = ['Fitter', 'Supervisor', 'Manager', 'Admin'].includes(user?.role || '');
  const canApprove = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {workOrder.number} - {workOrder.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{workOrder.type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{workOrder.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900">{workOrder.priority}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Asset</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {workOrder.asset.code} - {workOrder.asset.name}
              </dd>
            </div>
            {workOrder.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.description}</dd>
              </div>
            )}
          </dl>

          {canComplete && workOrder.status !== 'Completed' && workOrder.status !== 'ApprovedClosed' && (
            <div className="mt-6">
              <button
                onClick={() => updateStatus('Completed')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Mark Completed
              </button>
            </div>
          )}

          {canApprove && workOrder.status === 'Completed' && (
            <div className="mt-6">
              <button
                onClick={() => updateStatus('ApprovedClosed')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Approve & Close
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          {workOrder.notes && workOrder.notes.length > 0 ? (
            <ul className="space-y-2">
              {workOrder.notes.map((note: any) => (
                <li key={note.id} className="border-b pb-2">
                  <p className="text-sm text-gray-900">{note.note}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.createdBy.firstName} {note.createdBy.lastName} -{' '}
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No notes</p>
          )}
        </div>
      </div>
    </div>
  );
}


