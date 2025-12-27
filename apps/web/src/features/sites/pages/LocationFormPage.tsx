import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSites } from '../context/SitesContext';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { canCreateLocation, canEditLocation } from '../lib/permissions';
import type { LocationStatus, LocationType } from '../types';

export function LocationFormPage() {
  const navigate = useNavigate();
  const { siteId, id } = useParams<{ siteId: string; id: string }>();
  const { user } = useAuth();
  const {
    currentLocation,
    sites,
    locations,
    loading,
    loadLocation,
    createNewLocation,
    updateLocationData,
  } = useSites();

  const isEdit = !!id;
  const canCreate = canCreateLocation(user?.role);
  const canEdit = canEditLocation(user?.role);

  useEffect(() => {
    if (id) {
      loadLocation(id);
    }
  }, [id, loadLocation]);

  const [formData, setFormData] = useState<Partial<Location>>({
    name: '',
    type: 'Zone',
    siteId: siteId || '',
    parentLocationId: undefined,
    status: 'Active',
    order: 1,
  });

  useEffect(() => {
    if (currentLocation && isEdit) {
      setFormData({
        name: currentLocation.name,
        type: currentLocation.type,
        siteId: currentLocation.siteId,
        parentLocationId: currentLocation.parentLocationId,
        status: currentLocation.status,
        order: currentLocation.order,
      });
    } else if (siteId) {
      setFormData((prev) => ({ ...prev, siteId }));
    }
  }, [currentLocation, isEdit, siteId]);

  if (!canCreate && !isEdit) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to create locations</div>
        </Card>
      </div>
    );
  }

  if (isEdit && !canEdit) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to edit locations</div>
        </Card>
      </div>
    );
  }

  const selectedSite = sites.find((s) => s.id === formData.siteId);
  const availableZones = locations.filter(
    (l) => l.siteId === formData.siteId && l.type === 'Zone' && l.status !== 'Closed'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert('Location name is required');
      return;
    }

    if (!formData.siteId) {
      alert('Site is required');
      return;
    }

    // Validate: Area must have parent if parent is specified
    if (formData.type === 'Area' && formData.parentLocationId) {
      const parent = locations.find((l) => l.id === formData.parentLocationId);
      if (!parent || parent.type !== 'Zone') {
        alert('Area must be under a Zone');
        return;
      }
    }

    try {
      if (isEdit && id) {
        await updateLocationData(id, {
          ...formData,
          updatedBy: user!.id,
          updatedByName: `${user!.firstName} ${user!.lastName}`,
        });
      } else {
        await createNewLocation({
          ...formData,
          name: formData.name!,
          type: formData.type!,
          siteId: formData.siteId!,
          status: formData.status || 'Active',
          order: formData.order || 1,
          createdAt: new Date().toISOString(),
          createdBy: user!.id,
          createdByName: `${user!.firstName} ${user!.lastName}`,
          updatedAt: new Date().toISOString(),
          updatedBy: user!.id,
          updatedByName: `${user!.firstName} ${user!.lastName}`,
          history: [],
        } as any);
      }
      navigate(`/sites/${formData.siteId}`);
    } catch (error: any) {
      alert(`Error saving location: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? 'Edit Location' : 'New Location'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <Select
                  value={formData.type || 'Zone'}
                  onChange={(e) => {
                    const type = e.target.value as LocationType;
                    setFormData({
                      ...formData,
                      type,
                      // Clear parent if switching from Area to Zone
                      parentLocationId: type === 'Zone' ? undefined : formData.parentLocationId,
                    });
                  }}
                  options={[
                    { value: 'Zone', label: 'Zone' },
                    { value: 'Area', label: 'Area' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                <Select
                  value={formData.siteId || ''}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Site' },
                    ...sites
                      .filter((s) => s.status !== 'Archived')
                      .map((s) => ({ value: s.id, label: s.name })),
                  ]}
                  disabled={!!siteId}
                />
              </div>

              {formData.type === 'Area' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent Zone (Optional)</label>
                  <Select
                    value={formData.parentLocationId || ''}
                    onChange={(e) => setFormData({ ...formData, parentLocationId: e.target.value || undefined })}
                    options={[
                      { value: '', label: 'None (Directly under Site)' },
                      ...availableZones.map((z) => ({ value: z.id, label: z.name })),
                    ]}
                  />
                  <p className="text-xs text-gray-500 mt-1">Areas can be directly under Site or under a Zone</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as LocationStatus })}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Restricted', label: 'Restricted' },
                    { value: 'Closed', label: 'Closed' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <Input
                  type="number"
                  value={formData.order || 1}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">For sorting within parent</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" variant="primary">
                {isEdit ? 'Update Location' : 'Create Location'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(formData.siteId ? `/sites/${formData.siteId}` : '/sites')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
