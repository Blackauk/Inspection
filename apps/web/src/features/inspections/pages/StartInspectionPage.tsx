import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { getAssets } from '../../assets/services';
import { mockSites } from '../mockData';
import { showToast } from '../../../components/common/Toast';

export function StartInspectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates, loadTemplates, createNewInspection } = useInspections();
  const assets = getAssets({});
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assetSearch, setAssetSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (selectedAssetId) {
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (asset) {
        setSelectedSiteId(asset.siteId);
      }
    }
  }, [selectedAssetId, assets]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  
  // Filter assets by search
  const filteredAssets = assets.filter((asset) => {
    if (!assetSearch) return true;
    const searchLower = assetSearch.toLowerCase();
    return (
      asset.id.toLowerCase().includes(searchLower) ||
      asset.assetTypeCode?.toLowerCase().includes(searchLower) ||
      asset.make?.toLowerCase().includes(searchLower) ||
      asset.model?.toLowerCase().includes(searchLower)
    );
  });

  // Filter templates by asset type if asset selected
  const availableTemplates = selectedAssetId
    ? templates.filter((t) => {
        const asset = assets.find((a) => a.id === selectedAssetId);
        if (!asset) return true;
        // If template has assetTypeCode, filter by it
        if (t.assetTypeCode && asset.assetTypeCode) {
          return t.assetTypeCode === asset.assetTypeCode;
        }
        return true; // Show all if no asset type restriction
      })
    : templates;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedTemplateId) {
      newErrors.templateId = 'Template is required';
    }
    if (!selectedAssetId) {
      newErrors.assetId = 'Asset is required';
    }
    if (!inspectionDate) {
      newErrors.inspectionDate = 'Inspection date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    if (!selectedTemplate || !user) return;
    
    try {
      const selectedAsset = assets.find((a) => a.id === selectedAssetId);
      const selectedSite = mockSites.find((s) => s.id === selectedSiteId);
      
      // Create inspection with status InProgress
      const inspection = await createNewInspection({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateVersion: selectedTemplate.version,
        inspectionType: selectedTemplate.inspectionType,
        result: 'Pending',
        status: 'InProgress',
        assetId: selectedAssetId,
        assetTypeCode: selectedAsset?.assetTypeCode,
        assetMake: selectedAsset?.make,
        assetModel: selectedAsset?.model,
        siteId: selectedSiteId,
        siteName: selectedSite?.name,
        inspectorId: user.id,
        inspectorName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        inspectionDate: new Date(inspectionDate).toISOString(),
        startedAt: new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        sections: selectedTemplate.sections,
        items: selectedTemplate.items,
        answers: [], // Empty answers to start
        attachments: [],
        signatures: [],
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        linkedDefectIds: [],
      });
      
      showToast('Inspection started successfully', 'success');
      
      // Navigate to runner page
      navigate(`/inspections/run/${inspection.id}`);
    } catch (error) {
      console.error('Failed to create inspection:', error);
      showToast('Failed to start inspection', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Start Inspection"
        subtitle="Select asset and template to begin inspection"
      />

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: Asset selector | Inspection template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset *
              </label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by asset ID, type, make, or model..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  size="sm"
                />
                <Select
                  value={selectedAssetId}
                  onChange={(e) => {
                    setSelectedAssetId(e.target.value);
                    if (errors.assetId) {
                      const newErrors = { ...errors };
                      delete newErrors.assetId;
                      setErrors(newErrors);
                    }
                  }}
                  options={[
                    { value: '', label: 'Select asset...' },
                    ...filteredAssets.map((a) => ({
                      value: a.id,
                      label: `${a.assetTypeCode || ''} ${a.id} - ${a.make || ''} ${a.model || ''}`,
                    })),
                  ]}
                  error={errors.assetId}
                />
              </div>
            </div>
            
            <div>
              <Select
                label="Inspection Template *"
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  if (errors.templateId) {
                    const newErrors = { ...errors };
                    delete newErrors.templateId;
                    setErrors(newErrors);
                  }
                }}
                options={[
                  { value: '', label: 'Select template...' },
                  ...availableTemplates
                    .filter((t) => t.isActive)
                    .map((t) => ({
                      value: t.id,
                      label: `${t.name} (${t.inspectionType})`,
                    })),
                ]}
                error={errors.templateId}
              />
            </div>
          </div>

          {/* Row 2: Inspection date | Due date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Inspection Date *"
              type="date"
              value={inspectionDate}
              onChange={(e) => {
                setInspectionDate(e.target.value);
                if (errors.inspectionDate) {
                  const newErrors = { ...errors };
                  delete newErrors.inspectionDate;
                  setErrors(newErrors);
                }
              }}
              error={errors.inspectionDate}
            />
            <Input
              label="Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Row 3: Inspector | Site */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Inspector"
              value={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || ''}
              disabled
            />
            <Input
              label="Site"
              value={mockSites.find((s) => s.id === selectedSiteId)?.name || ''}
              disabled
            />
          </div>

          {/* Row 4: Notes spans full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-500 text-sm"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or context for this inspection..."
            />
          </div>

          {/* Actions - Primary CTA right-aligned */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/inspections')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Start Inspection
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

