import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Textarea } from '../../../components/common/Textarea';
import { showToast } from '../../../components/common/Toast';
import { getAssetTypes, getAssets, updateAsset, mockSites, mockResponsibleTeams } from '../services';
import type { Asset, AssetType, Ownership, Criticality } from '../types';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  onSave: (updatedAsset: Asset) => void;
}

export function EditAssetModal({
  isOpen,
  onClose,
  asset,
  onSave,
}: EditAssetModalProps) {
  const [formData, setFormData] = useState({
    assetTypeId: asset.assetTypeId,
    make: asset.make,
    model: asset.model,
    manufacturer: asset.manufacturer,
    manufacturerModelNumber: asset.manufacturerModelNumber || '',
    supplierSerialNumber: asset.supplierSerialNumber || '',
    internalClientAssetNumber: asset.internalClientAssetNumber || '',
    siteId: asset.siteId,
    location: asset.location || '',
    responsibleTeam: asset.responsibleTeam || '',
    ownership: asset.ownership,
    hireCompany: asset.hireCompany || '',
    commissionDate: asset.commissionDate || '',
    dateBroughtToSite: asset.dateBroughtToSite || '',
    notes: asset.notes || '',
    criticality: asset.criticality,
  });

  const [isSaving, setIsSaving] = useState(false);
  const assetTypes = getAssetTypes();
  const sites = mockSites;

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        assetTypeId: asset.assetTypeId,
        make: asset.make,
        model: asset.model,
        manufacturer: asset.manufacturer,
        manufacturerModelNumber: asset.manufacturerModelNumber || '',
        supplierSerialNumber: asset.supplierSerialNumber || '',
        internalClientAssetNumber: asset.internalClientAssetNumber || '',
        siteId: asset.siteId,
        location: asset.location || '',
        responsibleTeam: asset.responsibleTeam || '',
        ownership: asset.ownership,
        hireCompany: asset.hireCompany || '',
        commissionDate: asset.commissionDate || '',
        dateBroughtToSite: asset.dateBroughtToSite || '',
        notes: asset.notes || '',
        criticality: asset.criticality,
      });
    }
  }, [isOpen, asset]);

  const handleSave = async () => {
    // Basic validation
    if (!formData.assetTypeId) {
      showToast('Asset Type is required', 'error');
      return;
    }
    if (!formData.siteId) {
      showToast('Site is required', 'error');
      return;
    }
    if (!formData.make || !formData.model) {
      showToast('Make and Model are required', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const selectedAssetType = assetTypes.find((at) => at.id === formData.assetTypeId);
      const selectedSite = sites.find((s) => s.id === formData.siteId);

      const updatedAsset = updateAsset(asset.id, {
        assetTypeId: formData.assetTypeId,
        assetTypeCode: selectedAssetType?.code || asset.assetTypeCode,
        assetTypeName: selectedAssetType?.name || asset.assetTypeName,
        make: formData.make,
        model: formData.model,
        manufacturer: formData.manufacturer,
        manufacturerModelNumber: formData.manufacturerModelNumber || undefined,
        supplierSerialNumber: formData.supplierSerialNumber || undefined,
        internalClientAssetNumber: formData.internalClientAssetNumber || undefined,
        siteId: formData.siteId,
        siteName: selectedSite?.name || asset.siteName,
        location: formData.location || undefined,
        responsibleTeam: formData.responsibleTeam || undefined,
        ownership: formData.ownership,
        hireCompany: formData.ownership === 'Hired' ? formData.hireCompany || undefined : undefined,
        commissionDate: formData.commissionDate || undefined,
        dateBroughtToSite: formData.dateBroughtToSite || undefined,
        notes: formData.notes || undefined,
        criticality: formData.criticality,
      });

      showToast('Asset updated successfully', 'success');
      onSave(updatedAsset);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update asset', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Asset"
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Asset ID (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset ID
          </label>
          <div className="font-mono font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            {asset.id}
          </div>
          <p className="text-xs text-gray-500 mt-1">System Asset ID (immutable)</p>
        </div>

        {/* Asset Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.assetTypeId}
            onChange={(e) => setFormData({ ...formData, assetTypeId: e.target.value })}
            options={[
              { value: '', label: '-- Select Asset Type --' },
              ...assetTypes.map((at) => ({ value: at.id, label: `${at.code} - ${at.name}` })),
            ]}
          />
        </div>

        {/* Make / Model / Manufacturer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="e.g., Caterpillar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., 320D"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            <Input
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g., Caterpillar"
            />
          </div>
        </div>

        {/* Serial Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer Model Number
            </label>
            <Input
              value={formData.manufacturerModelNumber}
              onChange={(e) => setFormData({ ...formData, manufacturerModelNumber: e.target.value })}
              placeholder="e.g., CAT-320D-2020"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Serial Number
            </label>
            <Input
              value={formData.supplierSerialNumber}
              onChange={(e) => setFormData({ ...formData, supplierSerialNumber: e.target.value })}
              placeholder="e.g., SN-EX-001-2020"
            />
          </div>
        </div>

        {/* Client Asset Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Asset Number (optional)
          </label>
          <Input
            value={formData.internalClientAssetNumber}
            onChange={(e) => setFormData({ ...formData, internalClientAssetNumber: e.target.value })}
            placeholder="e.g., CLIENT-EX-001"
          />
        </div>

        {/* Site / Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
              options={[
                { value: '', label: '-- Select Site --' },
                ...sites.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Yard 1"
            />
          </div>
        </div>

        {/* Responsible Team / Ownership */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsible Team
            </label>
            <Select
              value={formData.responsibleTeam}
              onChange={(e) => setFormData({ ...formData, responsibleTeam: e.target.value })}
              options={[
                { value: '', label: '-- Select Team --' },
                ...mockResponsibleTeams.map((team) => ({ value: team, label: team })),
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ownership
            </label>
            <Select
              value={formData.ownership}
              onChange={(e) => setFormData({ ...formData, ownership: e.target.value as Ownership })}
              options={[
                { value: 'Owned', label: 'Owned' },
                { value: 'Hired', label: 'Hired' },
              ]}
            />
          </div>
        </div>

        {/* Hire Company (conditional) */}
        {formData.ownership === 'Hired' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hire Company
            </label>
            <Input
              value={formData.hireCompany}
              onChange={(e) => setFormData({ ...formData, hireCompany: e.target.value })}
              placeholder="e.g., Hire Co Ltd"
            />
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commissioning Date
            </label>
            <Input
              type="date"
              value={formData.commissionDate}
              onChange={(e) => setFormData({ ...formData, commissionDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Brought to Site
            </label>
            <Input
              type="date"
              value={formData.dateBroughtToSite}
              onChange={(e) => setFormData({ ...formData, dateBroughtToSite: e.target.value })}
            />
          </div>
        </div>

        {/* Criticality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Criticality
          </label>
          <Select
            value={formData.criticality}
            onChange={(e) => setFormData({ ...formData, criticality: e.target.value as Criticality })}
            options={[
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
            ]}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this asset..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Edit className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}


