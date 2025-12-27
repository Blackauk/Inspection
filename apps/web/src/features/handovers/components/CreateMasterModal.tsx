import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Checkbox } from '../../../components/common/Checkbox';
import { Select } from '../../../components/common/Select';
import { Textarea } from '../../../components/common/Textarea';
import { useAuth } from '../../../contexts/AuthContext';
import { mockSites } from '../../assets/services';
import { getFitterHandovers, createMasterHandover, getFitterHandoverById } from '../services';
import { showToast } from '../../../components/common/Toast';
import type { FitterHandover, ShiftType, Personnel, MaterialItem, MasterHandoverSection } from '../types';

interface CreateMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const shiftPatterns = ['5-2', '7D3O', '7N4O', '4-4', '6-3'];

export function CreateMasterModal({ isOpen, onClose, onSuccess }: CreateMasterModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    shiftType: 'Days' as ShiftType,
    shiftPattern: '5-2',
    compiledSummary: '',
  });

  const [selectedHandoverIds, setSelectedHandoverIds] = useState<string[]>([]);
  const [availableHandovers, setAvailableHandovers] = useState<FitterHandover[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        siteId: user?.siteIds?.[0] || '',
        date: new Date().toISOString().split('T')[0],
        shiftType: 'Days',
        shiftPattern: '5-2',
        compiledSummary: '',
      });
      setSelectedHandoverIds([]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen && formData.siteId && formData.date && formData.shiftType) {
      // Get approved handovers for this site/date/shift
      const approved = getFitterHandovers({
        siteId: formData.siteId,
        dateFrom: formData.date,
        dateTo: formData.date,
        shiftType: formData.shiftType,
        status: 'Approved',
      });
      setAvailableHandovers(approved);
    } else {
      setAvailableHandovers([]);
    }
  }, [isOpen, formData.siteId, formData.date, formData.shiftType]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleHandover = (id: string) => {
    setSelectedHandoverIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompile = () => {
    if (selectedHandoverIds.length === 0) {
      showToast('Please select at least one approved handover', 'error');
      return;
    }

    // Compile summary from selected handovers
    const handovers = selectedHandoverIds.map(id => getFitterHandoverById(id)).filter(Boolean) as FitterHandover[];
    
    let compiled = '=== COMPILED SHIFT HANDOVER ===\n\n';
    handovers.forEach(handover => {
      compiled += `--- ${handover.fitterName} (${handover.id}) ---\n`;
      compiled += `${handover.shiftComments}\n\n`;
      if (handover.materialsUsed.length > 0) {
        compiled += 'Materials Used:\n';
        handover.materialsUsed.forEach(m => {
          compiled += `- ${m.item}${m.qty ? ` (${m.qty})` : ''}${m.notes ? ` - ${m.notes}` : ''}\n`;
        });
        compiled += '\n';
      }
      if (handover.materialsRequired.length > 0) {
        compiled += 'Materials Required:\n';
        handover.materialsRequired.forEach(m => {
          compiled += `- ${m.item}${m.qty ? ` (${m.qty})` : ''}${m.notes ? ` - ${m.notes}` : ''}\n`;
        });
        compiled += '\n';
      }
      compiled += '\n';
    });

    handleFieldChange('compiledSummary', compiled);
  };

  const handleSubmit = () => {
    if (!formData.siteId || !formData.date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (selectedHandoverIds.length === 0) {
      showToast('Please select at least one approved handover', 'error');
      return;
    }

    if (!user) {
      showToast('User not found', 'error');
      return;
    }

    const site = mockSites.find(s => s.id === formData.siteId);
    if (!site) {
      showToast('Selected site not found', 'error');
      return;
    }

    // Aggregate personnel and create sections
    const aggregatedPersonnel = aggregatePersonnel(selectedHandoverIds);
    const initialSections = createInitialSections(selectedHandoverIds);
    
    const master = createMasterHandover({
      siteId: formData.siteId,
      siteName: site.name,
      date: formData.date,
      shiftType: formData.shiftType,
      shiftPattern: formData.shiftPattern,
      supervisorUserId: user.id,
      supervisorName: `${user.firstName} ${user.lastName}`,
      includedHandoverIds: selectedHandoverIds,
      compiledSummary: formData.compiledSummary || 'Compiled master handover',
      personnel: aggregatedPersonnel,
      sections: initialSections,
      overarchingComments: '',
      status: 'Draft',
      distributionLog: [],
    });

    showToast('Master handover created successfully', 'success');
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Master Handover"
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Site"
            value={formData.siteId}
            onChange={(e) => handleFieldChange('siteId', e.target.value)}
            options={[
              { value: '', label: 'Select site...' },
              ...mockSites.map(site => ({ value: site.id, label: site.name })),
            ]}
          />
          <Input
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
          />
          <Select
            label="Shift Type"
            value={formData.shiftType}
            onChange={(e) => handleFieldChange('shiftType', e.target.value as ShiftType)}
            options={[
              { value: 'Days', label: 'Days' },
              { value: 'Nights', label: 'Nights' },
            ]}
          />
          <Select
            label="Shift Pattern"
            value={formData.shiftPattern}
            onChange={(e) => handleFieldChange('shiftPattern', e.target.value)}
            options={shiftPatterns.map(pattern => ({ value: pattern, label: pattern }))}
          />
        </div>

        {/* Select Approved Handovers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Select Approved Handovers</h3>
            <Button onClick={handleCompile} size="sm" variant="outline" disabled={selectedHandoverIds.length === 0}>
              Compile Summary
            </Button>
          </div>
          {availableHandovers.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No approved handovers found for the selected site, date, and shift.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-4 bg-white">
              {availableHandovers.map(handover => {
                const isSelected = selectedHandoverIds.includes(handover.id);
                return (
                  <label
                    key={handover.id}
                    className={`flex items-start gap-3 p-2 rounded cursor-pointer ${
                      isSelected
                        ? 'bg-white border border-blue-500 hover:bg-blue-50'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleToggleHandover(handover.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{handover.id}</div>
                      <div className="text-xs text-gray-500">{handover.fitterName} • {handover.locations.join(', ')}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Compiled Summary */}
        <div>
          <Textarea
            label="Compiled Summary"
            value={formData.compiledSummary}
            onChange={(e) => handleFieldChange('compiledSummary', e.target.value)}
            placeholder="Compiled summary will appear here after clicking 'Compile Summary', or enter manually..."
            rows={10}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selectedHandoverIds.length === 0}>
            Create Master Handover
          </Button>
        </div>
      </div>
    </Modal>
  );
}

