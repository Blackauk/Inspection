import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Select } from '../../../components/common/Select';
import { Input } from '../../../components/common/Input';
import { canCreateInspection } from '../lib/permissions';
import { getAssets } from '../../assets/services';
import { mockSites } from '../mockData';
import type { InspectionType } from '../types';

export function InspectionFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    templates,
    loading,
    loadTemplates,
    createNewInspection,
  } = useInspections();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const canCreate = canCreateInspection(user?.role);

  if (!canCreate) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">You do not have permission to create inspections</div>
        </Card>
      </div>
    );
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const availableAssets = getAssets(); // Mock - in real app would filter by site

  const handleStart = async () => {
    if (!selectedTemplateId) {
      alert('Please select a template');
      return;
    }

    if (!selectedAssetId && !selectedSiteId) {
      alert('Please select an asset or location');
      return;
    }

    if (!selectedTemplate) {
      alert('Template not found');
      return;
    }

    try {
      const newInspection = await createNewInspection({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateVersion: selectedTemplate.version,
        inspectionType: selectedTemplate.inspectionType,
        result: 'Pending',
        status: 'Draft',
        assetId: selectedAssetId || undefined,
        locationId: selectedSiteId || undefined,
        siteId: selectedSiteId || undefined,
        siteName: selectedSiteId ? mockSites.find((s) => s.id === selectedSiteId)?.name : undefined,
        inspectionDate: new Date(inspectionDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        sections: selectedTemplate.sections,
        items: selectedTemplate.items,
        answers: [],
        attachments: [],
        signatures: [],
        linkedDefectIds: [],
        inspectorId: user!.id,
        inspectorName: `${user!.firstName} ${user!.lastName}`,
        createdAt: new Date().toISOString(),
        createdBy: user!.id,
        createdByName: `${user!.firstName} ${user!.lastName}`,
        updatedAt: new Date().toISOString(),
        updatedBy: user!.id,
        updatedByName: `${user!.firstName} ${user!.lastName}`,
        history: [],
      });

      navigate(`/inspections/${newInspection.id}`);
    } catch (error: any) {
      alert(`Error creating inspection: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Start New Inspection</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Template <span className="text-red-600">*</span>
              </label>
              <Select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                options={[
                  { value: '', label: 'Select Template' },
                  ...templates
                    .filter((t) => t.isActive)
                    .map((t) => ({ value: t.id, label: `${t.name} (${t.inspectionType})` })),
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
                <Select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Asset (Optional)' },
                    ...availableAssets.slice(0, 20).map((a) => ({
                      value: a.id,
                      label: `${a.id} - ${a.make} ${a.model}`,
                    })),
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">At least one of Asset or Location is required</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location / Site</label>
                <Select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  options={[
                    { value: '', label: 'Select Site (Optional)' },
                    ...mockSites.map((site) => ({ value: site.id, label: site.name })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Date</label>
                <Input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Template Details</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Name: {selectedTemplate.name}</div>
                  <div>Type: {selectedTemplate.inspectionType}</div>
                  <div>Version: {selectedTemplate.version}</div>
                  <div>Items: {selectedTemplate.items.length}</div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t">
              <Button onClick={handleStart} variant="primary" disabled={!selectedTemplateId}>
                Start Inspection
              </Button>
              <Button variant="outline" onClick={() => navigate('/inspections')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
