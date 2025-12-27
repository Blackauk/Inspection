import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { showToast } from '../../../components/common/Toast';
import { X, Plus, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import type { InspectionType, ChecklistItem, ChecklistSection } from '../types';

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentTemplate,
    loading,
    loadTemplate,
    updateTemplateData,
  } = useInspections();
  
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [inspectionType, setInspectionType] = useState<InspectionType>('Daily');
  const [assetTypeCodes, setAssetTypeCodes] = useState<string[]>([]);
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadTemplate(id);
    }
  }, [id, loadTemplate]);

  useEffect(() => {
    if (currentTemplate) {
      setTemplateName(currentTemplate.name);
      setDescription(currentTemplate.description || '');
      setInspectionType(currentTemplate.inspectionType);
      setAssetTypeCodes(currentTemplate.assetTypeCode ? [currentTemplate.assetTypeCode] : []);
      setSections([...currentTemplate.sections]);
      setItems([...currentTemplate.items]);
    }
  }, [currentTemplate]);

  const assetTypeOptions = [
    { value: 'MEWP', label: 'MEWP' },
    { value: 'EX', label: 'Excavator' },
    { value: 'CR', label: 'Crane' },
    { value: 'FL', label: 'Forklift' },
    { value: 'GEN', label: 'Generator' },
    { value: 'COM', label: 'Compressor' },
    { value: 'PU', label: 'Pump' },
  ];

  const addSection = () => {
    const newSection: ChecklistSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setItems((prev) => prev.filter((i) => i.sectionId !== id));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newSections = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      return newSections.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const addItem = (sectionId?: string) => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      sectionId,
      question: 'New checklist item',
      type: 'PassFailNA',
      required: true,
      safetyCritical: false,
      order: items.filter((i) => i.sectionId === sectionId).length,
      photoRequiredOnFail: false,
      failRequiresComment: false,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      
      const sectionItems = prev.filter((i) => i.sectionId === item.sectionId);
      const index = sectionItems.findIndex((i) => i.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === sectionItems.length - 1) return prev;
      
      const newItems = [...prev];
      const targetItem = sectionItems[direction === 'up' ? index - 1 : index + 1];
      const targetIndex = newItems.findIndex((i) => i.id === targetItem.id);
      const currentIndex = newItems.findIndex((i) => i.id === id);
      
      [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
      return newItems;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }
    if (items.length === 0) {
      newErrors.items = 'At least one checklist item is required';
    }
    
    for (const item of items) {
      if (!item.question.trim()) {
        newErrors[`item-${item.id}`] = 'Question is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!currentTemplate || !user) return;
    
    if (!validate()) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateTemplateData(currentTemplate.id, {
        name: templateName,
        description: description || undefined,
        inspectionType,
        assetTypeCode: assetTypeCodes.length > 0 ? assetTypeCodes[0] : undefined,
        sections: sections.length > 0 ? sections : [],
        items: items.map((item, index) => ({
          ...item,
          order: item.order !== undefined ? item.order : index,
        })),
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
      });
      
      showToast('Template saved', 'success');
    } catch (error) {
      console.error('Failed to save template:', error);
      showToast('Failed to save template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentTemplate || !user) return;
    
    if (!validate()) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateTemplateData(currentTemplate.id, {
        name: templateName,
        description: description || undefined,
        inspectionType,
        assetTypeCode: assetTypeCodes.length > 0 ? assetTypeCodes[0] : undefined,
        sections: sections.length > 0 ? sections : [],
        items: items.map((item, index) => ({
          ...item,
          order: item.order !== undefined ? item.order : index,
        })),
        isActive: true,
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
      });
      
      showToast('Template published successfully', 'success');
      navigate('/inspections');
    } catch (error) {
      console.error('Failed to publish template:', error);
      showToast('Failed to publish template', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedItems = (sectionId?: string) => {
    return items.filter((item) => item.sectionId === sectionId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Loading template...</div>
        </Card>
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Template not found</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Edit Template: ${currentTemplate.name}`}
        subtitle="Update inspection template"
      />

      <Card>
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Template Name *"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setErrors({ ...errors, templateName: undefined });
                }}
                error={errors.templateName}
              />
            </div>
            
            <div>
              <Select
                label="Inspection Type *"
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value as InspectionType)}
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
          </div>

          {/* Asset Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applies to Asset Types (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {assetTypeOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assetTypeCodes.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssetTypeCodes([...assetTypeCodes, option.value]);
                      } else {
                        setAssetTypeCodes(assetTypeCodes.filter((c) => c !== option.value));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Template description..."
            />
          </div>
          
          {/* Sections & Items - Same as CreateTemplatePage */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Checklist Items</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addSection}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Section
                </Button>
                <Button
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
            
            <div className="border rounded-lg divide-y max-h-[600px] overflow-y-auto">
              {/* Items without sections */}
              {items.filter((i) => !i.sectionId).map((item, index, arr) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={index === arr.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
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
                        {item.type === 'Number' && (
                          <>
                            <Input
                              type="text"
                              placeholder="Unit"
                              value={item.unit || ''}
                              onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                              className="w-24"
                              size="sm"
                            />
                            <Input
                              type="number"
                              placeholder="Min"
                              value={item.minValue?.toString() || ''}
                              onChange={(e) => updateItem(item.id, { minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-20"
                              size="sm"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={item.maxValue?.toString() || ''}
                              onChange={(e) => updateItem(item.id, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                              className="w-20"
                              size="sm"
                            />
                          </>
                        )}
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
              {sections.map((section, sectionIndex) => {
                const sectionItems = groupedItems(section.id);
                return (
                  <div key={section.id} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(section.id, 'up')}
                          disabled={sectionIndex === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(section.id, 'down')}
                          disabled={sectionIndex === sections.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
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
                      {sectionItems.map((item, itemIndex, arr) => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => moveItem(item.id, 'up')}
                                disabled={itemIndex === 0}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItem(item.id, 'down')}
                                disabled={itemIndex === arr.length - 1}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
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
                                {item.type === 'Number' && (
                                  <>
                                    <Input
                                      type="text"
                                      placeholder="Unit"
                                      value={item.unit || ''}
                                      onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                                      className="w-20"
                                      size="sm"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Min"
                                      value={item.minValue?.toString() || ''}
                                      onChange={(e) => updateItem(item.id, { minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                      className="w-16"
                                      size="sm"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Max"
                                      value={item.maxValue?.toString() || ''}
                                      onChange={(e) => updateItem(item.id, { maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                      className="w-16"
                                      size="sm"
                                    />
                                  </>
                                )}
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
                        size="sm"
                        variant="outline"
                        onClick={() => addItem(section.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Item to Section
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {sections.length === 0 && items.filter((i) => !i.sectionId).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No checklist items. Click "Add Item" to get started.
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate('/inspections')}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            {!currentTemplate.isActive && (
              <Button
                variant="primary"
                onClick={handlePublish}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing...' : 'Publish Template'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

