import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Checkbox } from '../../../components/common/Checkbox';
import { Badge } from '../../../components/common/Badge';
import { showToast } from '../../../components/common/Toast';
import {
  getFrequencies,
  createFrequency,
  updateFrequency,
  deleteFrequency,
  isFrequencyInUse,
  formatFrequency,
  type Frequency,
  type FrequencyCategory,
  type TimeUnit,
  type DistanceUnit,
} from '../services';

export function FrequenciesSection() {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'TIME' as FrequencyCategory,
    intervalValue: undefined as number | undefined,
    intervalUnit: 'day' as TimeUnit | 'hours' | DistanceUnit,
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadFrequencies();
  }, []);

  const loadFrequencies = () => {
    const all = getFrequencies({ includeInactive: true });
    setFrequencies(all);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: '',
      category: 'TIME',
      intervalValue: undefined,
      intervalUnit: 'day',
      isActive: true,
      sortOrder: frequencies.length + 1,
    });
  };

  const handleEdit = (frequency: Frequency) => {
    setEditingId(frequency.id);
    setIsCreating(false);
    setFormData({
      name: frequency.name,
      category: frequency.category,
      intervalValue: frequency.intervalValue,
      intervalUnit: frequency.intervalUnit || 'day',
      isActive: frequency.isActive,
      sortOrder: frequency.sortOrder,
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      category: 'TIME',
      intervalValue: undefined,
      intervalUnit: 'day',
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showToast('Frequency name is required', 'error');
      return;
    }

    if (formData.category === 'TIME' && !formData.intervalValue) {
      showToast('Interval value is required for time-based frequencies', 'error');
      return;
    }

    if ((formData.category === 'HOURS' || formData.category === 'DISTANCE') && !formData.intervalValue) {
      showToast('Interval value is required', 'error');
      return;
    }

    if (isCreating) {
      createFrequency(formData);
      showToast('Frequency created successfully', 'success');
    } else if (editingId) {
      updateFrequency(editingId, formData);
      showToast('Frequency updated successfully', 'success');
    }

    loadFrequencies();
    handleCancel();
  };

  const handleDelete = (id: string) => {
    if (isFrequencyInUse(id)) {
      showToast('Cannot delete frequency that is in use. Deactivating instead.', 'warning');
      updateFrequency(id, { isActive: false });
      loadFrequencies();
      return;
    }

    if (!confirm('Are you sure you want to delete this frequency?')) {
      return;
    }

    deleteFrequency(id);
    showToast('Frequency deleted', 'success');
    loadFrequencies();
  };

  const getTimeUnitOptions = (): Array<{ value: string; label: string }> => {
    return [
      { value: 'day', label: 'Day(s)' },
      { value: 'week', label: 'Week(s)' },
      { value: 'month', label: 'Month(s)' },
      { value: 'year', label: 'Year(s)' },
    ];
  };

  const getDistanceUnitOptions = (): Array<{ value: string; label: string }> => {
    return [
      { value: 'm', label: 'Metres (m)' },
      { value: 'km', label: 'Kilometres (km)' },
      { value: 'metres', label: 'Metres' },
      { value: 'kilometres', label: 'Kilometres' },
    ];
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Frequencies & Intervals</h2>
        {!isCreating && !editingId && (
          <Button size="sm" onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Frequency
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Daily, Every 250 hours, Every 10,000 m"
            />
            <Select
              label="Category *"
              value={formData.category}
              onChange={(e) => {
                const category = e.target.value as FrequencyCategory;
                setFormData({
                  ...formData,
                  category,
                  intervalUnit: category === 'TIME' ? 'day' : category === 'HOURS' ? 'hours' : 'm',
                });
              }}
              options={[
                { value: 'TIME', label: 'Time-based' },
                { value: 'HOURS', label: 'Hours-based' },
                { value: 'DISTANCE', label: 'Distance-based' },
              ]}
            />
            {formData.category === 'TIME' && (
              <>
                <Input
                  label="Interval Value *"
                  type="number"
                  value={formData.intervalValue?.toString() || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intervalValue: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  min={1}
                />
                <Select
                  label="Interval Unit *"
                  value={formData.intervalUnit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intervalUnit: e.target.value as TimeUnit,
                    })
                  }
                  options={getTimeUnitOptions()}
                />
              </>
            )}
            {formData.category === 'HOURS' && (
              <Input
                label="Interval Value (hours) *"
                type="number"
                value={formData.intervalValue?.toString() || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    intervalValue: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                min={1}
              />
            )}
            {formData.category === 'DISTANCE' && (
              <>
                <Input
                  label="Interval Value *"
                  type="number"
                  value={formData.intervalValue?.toString() || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intervalValue: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    })
                  }
                  min={1}
                />
                <Select
                  label="Interval Unit *"
                  value={formData.intervalUnit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intervalUnit: e.target.value as DistanceUnit,
                    })
                  }
                  options={getDistanceUnitOptions()}
                />
              </>
            )}
            <div className="flex items-end">
              <Checkbox
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            </div>
            <Input
              label="Sort Order"
              type="number"
              value={formData.sortOrder.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortOrder: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="primary" onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              {isCreating ? 'Create' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Frequencies Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interval</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {frequencies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No frequencies defined. Click "Add Frequency" to create one.
                </td>
              </tr>
            ) : (
              frequencies.map((frequency) => (
                <tr key={frequency.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {frequency.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Badge variant="info">{frequency.category}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {frequency.intervalValue !== undefined
                      ? `${frequency.intervalValue} ${frequency.intervalUnit || ''}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant={frequency.isActive ? 'success' : 'default'}>
                      {frequency.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {frequency.sortOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(frequency)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(frequency.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

