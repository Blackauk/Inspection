import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSites } from '../context/SitesContext';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { canCreateSite, canEditSite } from '../lib/permissions';
import type { SiteStatus } from '../types';

export function SiteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    currentSite,
    loading,
    loadSite,
    createNewSite,
    updateSiteData,
  } = useSites();

  const isEdit = !!id;
  const canCreate = canCreateSite(user?.role);
  const canEdit = canEditSite(user?.role);

  useEffect(() => {
    if (id) {
      loadSite(id);
    }
  }, [id, loadSite]);

  const [formData, setFormData] = useState<Partial<Site>>({
    name: '',
    status: 'Active',
    code: '',
    address: '',
    siteManagerName: '',
    notes: '',
  });

  useEffect(() => {
    if (currentSite && isEdit) {
      setFormData({
        name: currentSite.name,
        status: currentSite.status,
        code: currentSite.code || '',
        address: currentSite.address || '',
        siteManagerName: currentSite.siteManagerName || '',
        notes: currentSite.notes || '',
      });
    }
  }, [currentSite, isEdit]);

  if (!canCreate && !isEdit) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to create sites</div>
        </Card>
      </div>
    );
  }

  if (isEdit && !canEdit) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to edit sites</div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      alert('Site name is required');
      return;
    }

    try {
      if (isEdit && id) {
        await updateSiteData(id, {
          ...formData,
          updatedBy: user!.id,
          updatedByName: `${user!.firstName} ${user!.lastName}`,
        });
      } else {
        await createNewSite({
          ...formData,
          name: formData.name!,
          status: formData.status || 'Active',
          createdAt: new Date().toISOString(),
          createdBy: user!.id,
          createdByName: `${user!.firstName} ${user!.lastName}`,
          updatedAt: new Date().toISOString(),
          updatedBy: user!.id,
          updatedByName: `${user!.firstName} ${user!.lastName}`,
          history: [],
        } as any);
      }
      navigate('/sites');
    } catch (error: any) {
      alert(`Error saving site: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? 'Edit Site' : 'New Site'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as SiteStatus })}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'Closed', label: 'Closed' },
                    { value: 'Archived', label: 'Archived' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Code (Optional)</label>
                <Input
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="SITE-A"
                />
                <p className="text-xs text-gray-500 mt-1">Must be unique if provided</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Industrial Way, City, Postcode"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Manager</label>
                <Input
                  value={formData.siteManagerName || ''}
                  onChange={(e) => setFormData({ ...formData, siteManagerName: e.target.value })}
                  placeholder="Manager name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this site..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" variant="primary">
                {isEdit ? 'Update Site' : 'Create Site'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/sites')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
