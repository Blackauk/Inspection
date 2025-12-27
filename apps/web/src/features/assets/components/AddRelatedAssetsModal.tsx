import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Input } from '../../../components/common/Input';
import { showToast } from '../../../components/common/Toast';
import { getAssets } from '../services';
import type { Asset } from '../types';

interface AddRelatedAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssetId: string;
  existingRelatedIds: string[];
  onAdd: (assetIds: string[]) => void;
}

export function AddRelatedAssetsModal({
  isOpen,
  onClose,
  currentAssetId,
  existingRelatedIds,
  onAdd,
}: AddRelatedAssetsModalProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Get all assets except current asset and already related ones
  const availableAssets = useMemo(() => {
    return getAssets({}).filter(
      (asset) => asset.id !== currentAssetId && !existingRelatedIds.includes(asset.id)
    );
  }, [currentAssetId, existingRelatedIds]);

  // Filter assets by search
  const filteredAssets = useMemo(() => {
    if (!search) return availableAssets;
    const searchLower = search.toLowerCase();
    return availableAssets.filter(
      (asset) =>
        asset.id.toLowerCase().includes(searchLower) ||
        asset.make.toLowerCase().includes(searchLower) ||
        asset.model.toLowerCase().includes(searchLower) ||
        asset.siteName.toLowerCase().includes(searchLower)
    );
  }, [availableAssets, search]);

  const toggleSelection = (assetId: string) => {
    setSelectedIds((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleAdd = () => {
    if (selectedIds.length === 0) {
      showToast('Please select at least one asset', 'error');
      return;
    }
    onAdd(selectedIds);
    setSelectedIds([]);
    setSearch('');
    showToast(`${selectedIds.length} asset(s) added`, 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Related Assets"
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Search by Asset ID, Make, Model, or Site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {selectedIds.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Selected ({selectedIds.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const asset = availableAssets.find((a) => a.id === id);
                return asset ? (
                  <Badge
                    key={id}
                    variant="info"
                    className="flex items-center gap-1"
                  >
                    {asset.id}
                    <button
                      onClick={() => toggleSelection(id)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="border rounded-lg max-h-96 overflow-y-auto">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search ? 'No assets found matching your search' : 'No assets available'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredAssets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleSelection(asset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="info">{asset.assetTypeCode}</Badge>
                          <span className="font-mono font-medium text-gray-900">
                            {asset.id}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {asset.make} {asset.model}
                        </div>
                        <div className="text-xs text-gray-500">
                          {asset.siteName} {asset.location && `• ${asset.location}`}
                        </div>
                      </div>
                      <div className="ml-4">
                        {isSelected ? (
                          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Selected ({selectedIds.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}


