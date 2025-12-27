import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Input } from '../../../components/common/Input';
import { Textarea } from '../../../components/common/Textarea';
import { showToast } from '../../../components/common/Toast';
import { getAssets } from '../services';
import {
  createAssetRelationship,
  wouldCreateCycle,
  getAssetById,
} from '../services';
import type { Asset } from '../types';
import { useAuth } from '../../../contexts/AuthContext';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssetId: string;
  onAdd: () => void;
}

export function AddRelationshipModal({
  isOpen,
  onClose,
  currentAssetId,
  onAdd,
}: AddRelationshipModalProps) {
  const { user } = useAuth();
  const [relationshipDirection, setRelationshipDirection] = useState<'parent' | 'child'>('child');
  const [search, setSearch] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Get all assets except current asset
  const availableAssets = useMemo(() => {
    return getAssets({}).filter((asset) => asset.id !== currentAssetId);
  }, [currentAssetId]);

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

  const handleAdd = () => {
    if (!selectedAssetId) {
      showToast('Please select an asset', 'error');
      return;
    }

    try {
      const parentAssetId =
        relationshipDirection === 'child' ? currentAssetId : selectedAssetId;
      const childAssetId =
        relationshipDirection === 'child' ? selectedAssetId : currentAssetId;

      // Check for cycles
      if (wouldCreateCycle(parentAssetId, childAssetId)) {
        showToast('This relationship would create a cycle', 'error');
        return;
      }

      createAssetRelationship(
        parentAssetId,
        childAssetId,
        'DEPENDENCY',
        notes || undefined,
        user?.id
      );

      showToast('Relationship added successfully', 'success');
      setSelectedAssetId('');
      setSearch('');
      setNotes('');
      onAdd();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create relationship', 'error');
    }
  };

  const currentAsset = getAssetById(currentAssetId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Relationship"
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship Direction
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="direction"
                value="child"
                checked={relationshipDirection === 'child'}
                onChange={() => setRelationshipDirection('child')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium">Add Child (dependent asset)</div>
                <div className="text-sm text-gray-500">
                  {currentAsset?.id} will be the parent. The selected asset will depend on it.
                </div>
              </div>
            </label>
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="direction"
                value="parent"
                checked={relationshipDirection === 'parent'}
                onChange={() => setRelationshipDirection('parent')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="font-medium">Add Parent (this asset depends on another)</div>
                <div className="text-sm text-gray-500">
                  {currentAsset?.id} will be the child. It will depend on the selected asset.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Asset
          </label>
          <Input
            type="text"
            placeholder="Search by Asset ID, Make, Model, or Site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search && (
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {filteredAssets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No assets found matching your search
              </div>
            ) : (
              <div className="divide-y">
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAssetId === asset.id;
                  return (
                    <div
                      key={asset.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedAssetId(asset.id)}
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
        )}

        {selectedAssetId && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-1">Selected Asset:</div>
            <div className="flex items-center gap-2">
              <Badge variant="info">
                {getAssetById(selectedAssetId)?.assetTypeCode}
              </Badge>
              <span className="font-mono font-medium">
                {selectedAssetId}
              </span>
              <span className="text-gray-600">
                {getAssetById(selectedAssetId)?.make}{' '}
                {getAssetById(selectedAssetId)?.model}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this relationship..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedAssetId}>
            <Plus className="w-4 h-4 mr-2" />
            Add Relationship
          </Button>
        </div>
      </div>
    </Modal>
  );
}


