import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { FileUpload, type UploadedFile } from '../../../components/common/FileUpload';
import { getAssets } from '../../assets/services';
import { mockSites } from '../mockData';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { showToast } from '../../../components/common/Toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../../components/common/Badge';
import type { InspectionTemplate, ChecklistItem, ChecklistItemAnswer } from '../types';

interface StartInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillAssetId?: string;
}

export function StartInspectionModal({ isOpen, onClose, prefillAssetId }: StartInspectionModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { templates, loadTemplates, createNewInspection } = useInspections();
  const assets = getAssets({});
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(prefillAssetId || '');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, ChecklistItemAnswer>>({});
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setHasUnsavedChanges(false);
    }
  }, [isOpen, loadTemplates]);

  useEffect(() => {
    if (prefillAssetId && isOpen) {
      const asset = assets.find((a) => a.id === prefillAssetId);
      if (asset) {
        setSelectedAssetId(asset.id);
        setSelectedSiteId(asset.siteId);
      }
    }
  }, [prefillAssetId, isOpen, assets]);

  useEffect(() => {
    if (selectedAssetId) {
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (asset) {
        setSelectedSiteId(asset.siteId);
      }
    }
  }, [selectedAssetId, assets]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleChecklistChange = (itemId: string, result: 'Pass' | 'Fail' | 'NA', comment?: string) => {
    setChecklistAnswers((prev) => ({
      ...prev,
      [itemId]: {
        id: `answer-${itemId}`,
        checklistItemId: itemId,
        result: result === 'NA' ? null : result,
        comment: comment || undefined,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedTemplateId) {
      newErrors.templateId = 'Template is required';
    }
    if (!selectedAssetId) {
      newErrors.assetId = 'Asset is required';
    }
    if (!selectedSiteId) {
      newErrors.siteId = 'Site is required';
    }
    
    // Check if all required checklist items are answered
    if (selectedTemplate) {
      const requiredItems = selectedTemplate.items.filter((item) => item.required);
      for (const item of requiredItems) {
        if (!checklistAnswers[item.id] || !checklistAnswers[item.id].result) {
          newErrors[`item-${item.id}`] = 'This item is required';
        }
      }
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
      // Calculate overall result
      const hasFail = Object.values(checklistAnswers).some(
        (answer) => answer.result === 'Fail'
      );
      const result = hasFail ? 'Fail' : 'Pass';
      
      // Create inspection
      const inspection = await createNewInspection({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        templateVersion: selectedTemplate.version,
        inspectionType: selectedTemplate.inspectionType,
        result: result as 'Pass' | 'Fail' | 'Pending',
        status: 'InProgress',
        assetId: selectedAssetId,
        assetTypeCode: assets.find((a) => a.id === selectedAssetId)?.typeCode,
        assetMake: assets.find((a) => a.id === selectedAssetId)?.make,
        assetModel: assets.find((a) => a.id === selectedAssetId)?.model,
        siteId: selectedSiteId,
        siteName: mockSites.find((s) => s.id === selectedSiteId)?.name,
        inspectorId: user.id,
        inspectorName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        inspectionDate: new Date(inspectionDate).toISOString(),
        startedAt: new Date().toISOString(),
        sections: selectedTemplate.sections,
        items: selectedTemplate.items,
        answers: Object.values(checklistAnswers),
        attachments: attachments.map((file) => ({
          id: `att-${Date.now()}-${Math.random()}`,
          type: file.type === 'image' ? 'photo' : file.type === 'video' ? 'video' : 'document',
          filename: file.name,
          uri: file.url || '',
          createdAt: new Date().toISOString(),
          createdBy: user.id,
        })),
        signatures: [],
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        history: [],
        revisionNumber: 0,
        linkedDefectIds: [],
      });
      
      showToast('Inspection started successfully', 'success');
      setHasUnsavedChanges(false);
      
      // If failed, prompt to create work order
      if (result === 'Fail') {
        const createWO = window.confirm(
          'Inspection failed. Would you like to create a Work Order for this issue?'
        );
        if (createWO) {
          onClose();
          navigate(`/work-orders/new?assetId=${selectedAssetId}&fromInspection=${inspection.id}`);
        } else {
          onClose();
          navigate(`/inspections/${inspection.id}`);
        }
      } else {
        onClose();
        navigate(`/inspections/${inspection.id}`);
      }
    } catch (error) {
      console.error('Failed to create inspection:', error);
      showToast('Failed to start inspection', 'error');
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Discard and close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Start Inspection"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Inspection Template *"
              value={selectedTemplateId}
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                setChecklistAnswers({});
                setHasUnsavedChanges(true);
              }}
              options={[
                { value: '', label: 'Select template...' },
                ...templates.filter((t) => t.isActive).map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.inspectionType})`,
                })),
              ]}
              error={errors.templateId}
            />
          </div>
          
          <div>
            <Select
              label="Asset *"
              value={selectedAssetId}
              onChange={(e) => {
                setSelectedAssetId(e.target.value);
                setHasUnsavedChanges(true);
              }}
              options={[
                { value: '', label: 'Select asset...' },
                ...assets.map((a) => ({
                  value: a.id,
                  label: `${a.typeCode} ${a.id} - ${a.make} ${a.model}`,
                })),
              ]}
              error={errors.assetId}
            />
          </div>
          
          <div>
            <Input
              label="Site"
              value={mockSites.find((s) => s.id === selectedSiteId)?.name || ''}
              disabled
            />
          </div>
          
          <div>
            <Input
              label="Inspection Date *"
              type="date"
              value={inspectionDate}
              onChange={(e) => {
                setInspectionDate(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
          </div>
        </div>
        
        {selectedTemplate && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Checklist</h3>
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {selectedTemplate.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <label className="font-medium text-gray-900">
                        {item.question}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                        {item.critical && (
                          <Badge variant="error" size="sm" className="ml-2">Critical</Badge>
                        )}
                      </label>
                      {item.photoRequiredOnFail && (
                        <p className="text-xs text-gray-500 mt-1">Photo required on fail</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={checklistAnswers[item.id]?.result === 'Pass' ? 'primary' : 'outline'}
                      onClick={() => handleChecklistChange(item.id, 'Pass')}
                    >
                      Pass
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={checklistAnswers[item.id]?.result === 'Fail' ? 'error' : 'outline'}
                      onClick={() => handleChecklistChange(item.id, 'Fail')}
                    >
                      Fail
                    </Button>
                    {item.type === 'PassFailNA' && (
                      <Button
                        type="button"
                        size="sm"
                        variant={checklistAnswers[item.id]?.result === null ? 'default' : 'outline'}
                        onClick={() => handleChecklistChange(item.id, 'NA')}
                      >
                        N/A
                      </Button>
                    )}
                  </div>
                  
                  {checklistAnswers[item.id]?.result === 'Fail' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Comment (required for failures)"
                        value={checklistAnswers[item.id]?.comment || ''}
                        onChange={(e) => {
                          const answer = checklistAnswers[item.id];
                          if (answer) {
                            handleChecklistChange(item.id, 'Fail', e.target.value);
                          }
                        }}
                        error={errors[`item-${item.id}`]}
                      />
                    </div>
                  )}
                  
                  {errors[`item-${item.id}`] && (
                    <p className="text-xs text-red-600 mt-1">{errors[`item-${item.id}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Additional notes..."
          />
        </div>
        
        <div>
          <FileUpload
            label="Attachments (Photos/Documents)"
            accept="image/*,.pdf,.doc,.docx,.xlsx"
            onFilesChange={setAttachments}
            maxFiles={10}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Start Inspection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
