import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useDefects } from '../context/DefectsContext';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { canRaiseDefect, canEditDefect } from '../lib/permissions';
import { mockSites } from '../../assets/services';
import type { Defect, SeverityModel, DefectStatus, DefectSeverity, ComplianceTag } from '../types';

export function DefectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    currentDefect,
    settings,
    loading,
    loadDefect,
    createNewDefect,
    updateDefectData,
  } = useDefects();

  const isEdit = !!id;
  const canCreate = canRaiseDefect(user?.role);
  const canEdit = canEditDefect(user?.role);

  useEffect(() => {
    if (id) {
      loadDefect(id);
    }
  }, [id, loadDefect]);

  const [formData, setFormData] = useState<Partial<Defect>>({
    title: '',
    description: '',
    severityModel: settings?.severityModelDefault || 'LMH',
    severity: 'Low',
    status: 'Open',
    complianceTags: [],
    actions: [],
    attachments: [],
    comments: [],
    history: [],
    beforeAfterRequired: settings?.beforeAfterRequired || false,
    reopenedCount: 0,
  });

  useEffect(() => {
    if (currentDefect && isEdit) {
      setFormData({
        title: currentDefect.title,
        description: currentDefect.description,
        severityModel: currentDefect.severityModel,
        severity: currentDefect.severity,
        status: currentDefect.status,
        complianceTags: currentDefect.complianceTags,
        assetId: currentDefect.assetId,
        locationId: currentDefect.locationId,
        inspectionId: currentDefect.inspectionId,
        siteId: currentDefect.siteId,
        assignedToId: currentDefect.assignedToId,
        targetRectificationDate: currentDefect.targetRectificationDate,
        actions: currentDefect.actions,
        beforeAfterRequired: currentDefect.beforeAfterRequired,
      });
    }
  }, [currentDefect, isEdit]);

  if (!canCreate && !isEdit) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to create defects</div>
        </Card>
      </div>
    );
  }

  if (isEdit && !canEdit) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to edit defects</div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      alert('Title is required');
      return;
    }

    try {
      if (isEdit && id) {
        await updateDefectData(id, {
          ...formData,
          updatedBy: user!.id,
          updatedByName: `${user!.firstName} ${user!.lastName}`,
        });
      } else {
        await createNewDefect({
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: user!.id,
          createdByName: `${user!.firstName} ${user!.lastName}`,
          updatedAt: new Date().toISOString(),
          updatedBy: user!.id,
          updatedByName: `${user!.firstName} ${user!.lastName}`,
        } as any);
      }
      navigate('/defects');
    } catch (error: any) {
      alert(`Error saving defect: ${error.message}`);
    }
  };

  const severityOptions = formData.severityModel === 'LMH'
    ? ['Low', 'Medium', 'High']
    : ['Minor', 'Major', 'Critical'];

  return (
    <div className="p-6">
      <Card>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {isEdit ? 'Edit Defect' : 'New Defect'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-600">*</span>
                </label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity Model</label>
                <Select
                  value={formData.severityModel || 'LMH'}
                  onChange={(e) => {
                    const model = e.target.value as SeverityModel;
                    setFormData({
                      ...formData,
                      severityModel: model,
                      severity: model === 'LMH' ? 'Low' : 'Minor',
                    });
                  }}
                  options={[
                    { value: 'LMH', label: 'Low / Medium / High' },
                    { value: 'MMC', label: 'Minor / Major / Critical' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <Select
                  value={formData.severity || 'Low'}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as DefectSeverity })}
                  options={severityOptions.map((s) => ({ value: s, label: s }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select
                  value={formData.status || 'Open'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DefectStatus })}
                  options={[
                    { value: 'Open', label: 'Open' },
                    { value: 'Acknowledged', label: 'Acknowledged' },
                    { value: 'InProgress', label: 'In Progress' },
                    { value: 'Deferred', label: 'Deferred' },
                    { value: 'Closed', label: 'Closed' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                <Select
                  value={formData.siteId || ''}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value || undefined })}
                  options={[
                    { value: '', label: 'Select Site' },
                    ...mockSites.map((site) => ({ value: site.id, label: site.name })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
                <Input
                  value={formData.assetId || ''}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value || undefined })}
                  placeholder="AST-000001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Rectification Date</label>
                <Input
                  type="date"
                  value={formData.targetRectificationDate || ''}
                  onChange={(e) => setFormData({ ...formData, targetRectificationDate: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" variant="primary">
                {isEdit ? 'Update Defect' : 'Create Defect'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/defects')}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
