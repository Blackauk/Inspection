import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { showToast } from '../../../components/common/Toast';
import { X, Plus, GripVertical } from 'lucide-react';
import type { InspectionType, ChecklistItem, ChecklistSection } from '../types';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTemplateModal({ isOpen, onClose }: CreateTemplateModalProps) {
  const { user } = useAuth();
  const { templates, loadTemplates, createTemplate } = useInspections();
  
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [inspectionType, setInspectionType] = useState<InspectionType>('Daily');
  const [assetTypeCode, setAssetTypeCode] = useState('');
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setHasUnsavedChanges(false);
      // Reset form
      setTemplateName('');
      setDescription('');
      setInspectionType('Daily');
      setAssetTypeCode('');
      setSections([]);
      setItems([]);
      setErrors({});
    }
  }, [isOpen, loadTemplates]);

  const addSection = () => {
    const newSection: ChecklistSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setHasUnsavedChanges(true);
  };

  const updateSection = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
    setHasUnsavedChanges(true);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setItems((prev) => prev.filter((i) => i.sectionId !== id));
    setHasUnsavedChanges(true);
  };

  const addItem = (sectionId?: string) => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      sectionId,
      question: 'New checklist item',
      type: 'PassFailNA',
      required: true,
      critical: false,
      order: items.filter((i) => i.sectionId === sectionId).length,
      photoRequiredOnFail: false,
    };
    setItems([...items, newItem]);
    setHasUnsavedChanges(true);
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    setHasUnsavedChanges(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setHasUnsavedChanges(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }
    if (items.length === 0) {
      newErrors.items = 'At least one checklist item is required';
    }
    
    // Validate items
    for (const item of items) {
      if (!item.question.trim()) {
        newErrors[`item-${item.id}`] = 'Question is required';
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
    
    if (!user) return;
    
    try {
      await createNewTemplate({
        name: templateName,
        description: description || undefined,
        inspectionType,
        assetTypeCode: assetTypeCode || undefined,
        version: 'v1',
        versions: [
          {
            version: 'v1',
            createdAt: new Date().toISOString(),
            createdBy: user.id,
            createdByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
          },
        ],
        sections: sections.length > 0 ? sections : [],
        items: items.map((item, index) => ({
          ...item,
          order: item.order !== undefined ? item.order : index,
        })),
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.name || 'Unknown',
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
      });
      
      showToast('Template created successfully', 'success');
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to create template:', error);
      showToast('Failed to create template', 'error');
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

  const groupedItems = (sectionId?: string) => {
    return items.filter((item) => item.sectionId === sectionId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Inspection Template"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Template Name *"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setHasUnsavedChanges(true);
              }}
              error={errors.templateName}
            />
          </div>
          
          <div>
            <Select
              label="Inspection Type *"
              value={inspectionType}
              onChange={(e) => {
                setInspectionType(e.target.value as InspectionType);
                setHasUnsavedChanges(true);
              }}
              options={[
                { value: 'PlantAcceptance', label: 'Plant Acceptance' },
                { value: 'Daily', label: 'Daily' },
                { value: 'Weekly', label: 'Weekly' },
                { value: 'Monthly', label: 'Monthly' },
                { value: 'PreUse', label: 'Pre-Use' },
                { value: 'TimeBased', label: 'Time-Based' },
              ]}
            />
          </div>
          
          <div>
            <Input
              label="Asset Type Code (optional)"
              value={assetTypeCode}
              onChange={(e) => {
                setAssetTypeCode(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="e.g., EX, FL, CR"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Template description..."
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Checklist Items</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addSection}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Section
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addItem()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>
          
          {errors.items && (
            <p className="text-sm text-red-600">{errors.items}</p>
          )}
          
          <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
            {sections.length === 0 && items.filter((i) => !i.sectionId).length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No checklist items. Click "Add Item" to get started.
              </div>
            )}
            
            {/* Items without sections */}
            {items.filter((i) => !i.sectionId).map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-2">
                  <GripVertical className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.question}
                      onChange={(e) => updateItem(item.id, { question: e.target.value })}
                      placeholder="Question"
                      error={errors[`item-${item.id}`]}
                    />
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                          className="rounded"
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.critical}
                          onChange={(e) => updateItem(item.id, { critical: e.target.checked })}
                          className="rounded"
                        />
                        Critical
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.photoRequiredOnFail}
                          onChange={(e) => updateItem(item.id, { photoRequiredOnFail: e.target.checked })}
                          className="rounded"
                        />
                        Photo on Fail
                      </label>
                      <Select
                        value={item.type}
                        onChange={(e) => updateItem(item.id, { type: e.target.value as ChecklistItem['type'] })}
                        options={[
                          { value: 'PassFail', label: 'Pass/Fail' },
                          { value: 'PassFailNA', label: 'Pass/Fail/N/A' },
                          { value: 'Number', label: 'Number' },
                          { value: 'Text', label: 'Text' },
                        ]}
                        className="w-40"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Sections with items */}
            {sections.map((section) => (
              <div key={section.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(section.id, e.target.value)}
                    placeholder="Section title"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="p-1 hover:bg-red-50 rounded text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="ml-7 space-y-2">
                  {groupedItems(section.id).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={item.question}
                            onChange={(e) => updateItem(item.id, { question: e.target.value })}
                            placeholder="Question"
                            error={errors[`item-${item.id}`]}
                            size="sm"
                          />
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={item.required}
                                onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                                className="rounded"
                              />
                              Required
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={item.critical}
                                onChange={(e) => updateItem(item.id, { critical: e.target.checked })}
                                className="rounded"
                              />
                              Critical
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={item.photoRequiredOnFail}
                                onChange={(e) => updateItem(item.id, { photoRequiredOnFail: e.target.checked })}
                                className="rounded"
                              />
                              Photo on Fail
                            </label>
                            <Select
                              value={item.type}
                              onChange={(e) => updateItem(item.id, { type: e.target.value as ChecklistItem['type'] })}
                              options={[
                                { value: 'PassFail', label: 'Pass/Fail' },
                                { value: 'PassFailNA', label: 'Pass/Fail/N/A' },
                                { value: 'Number', label: 'Number' },
                                { value: 'Text', label: 'Text' },
                              ]}
                              className="w-32"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(section.id)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item to Section
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Template
          </Button>
        </div>
      </form>
    </Modal>
  );
}
