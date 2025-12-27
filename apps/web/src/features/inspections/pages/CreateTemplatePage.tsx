import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Badge } from '../../../components/common/Badge';
import { DatePicker } from '../../../components/common/DatePicker';
import { SearchableMultiSelect } from '../../../components/common/SearchableMultiSelect';
import { Modal } from '../../../components/common/Modal';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { showToast } from '../../../components/common/Toast';
import { getAssets, getAssetTypes } from '../../assets/services';
import { getFrequencies, formatFrequency, type Frequency } from '../../settings/services';
import { Plus, GripVertical, ArrowUp, ArrowDown, Trash2, ChevronDown, ChevronUp, Download, Upload, AlertTriangle, Info, CalendarClock, CheckCircle2, XCircle } from 'lucide-react';
import { downloadExcelTemplate, uploadExcelFile } from '../utils/excelUtils';
import { UNIT_OPTIONS, STANDARD_UNITS } from '../constants/units';
import type { InspectionType, ChecklistItem, ChecklistSection } from '../types';

type ApplyScope = 'ALL' | 'TYPES' | 'ASSETS';

export function CreateTemplatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadTemplates, createNewTemplate } = useInspections();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [inspectionType, setInspectionType] = useState<InspectionType>('Daily');
  const [frequencyId, setFrequencyId] = useState<string>('');
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Apply Scope state
  const [applyScope, setApplyScope] = useState<ApplyScope>('ALL');
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // Template Availability state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Load frequencies on mount
  useEffect(() => {
    const loadedFrequencies = getFrequencies();
    setFrequencies(loadedFrequencies);
    // Set default frequency if available
    if (loadedFrequencies.length > 0 && !frequencyId) {
      setFrequencyId(loadedFrequencies[0].id);
    }
  }, []);
  
  // Excel import state
  const [importWarnings, setImportWarnings] = useState<Array<{ row: number; message: string }>>([]);
  const [showImportIssues, setShowImportIssues] = useState(false);

  // Asset types from services
  const assetTypes = getAssetTypes();

  const assetTypeOptions = assetTypes.map((at) => ({
    value: at.id,
    label: `${at.code} - ${at.name}`,
  }));

  // Get assets for selection
  const allAssets = getAssets({});
  const assetOptions = allAssets.map((asset) => ({
    value: asset.id,
    label: `${asset.id} – ${asset.assetTypeCode || ''} ${asset.make || ''} ${asset.model || ''}`,
  }));

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Ensure all items belong to a section
  useEffect(() => {
    if (items.length > 0 && sections.length === 0) {
      const generalSection: ChecklistSection = {
        id: 'general-section',
        title: 'General',
        order: 0,
      };
      setSections([generalSection]);
      setItems((prev) => prev.map((item) => ({ ...item, sectionId: item.sectionId || 'general-section' })));
      setExpandedSections(new Set(['general-section']));
    }
  }, [items, sections]);

  const addSection = () => {
    const newSection: ChecklistSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
  };

  const updateSection = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const removeSection = (id: string) => {
    if (window.confirm('Delete this section? All items in this section will also be deleted.')) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      setItems((prev) => prev.filter((i) => i.sectionId !== id));
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
    let targetSectionId = sectionId;
    if (!targetSectionId) {
      if (sections.length === 0) {
        const generalSection: ChecklistSection = {
          id: 'general-section',
          title: 'General',
          order: 0,
        };
        setSections([generalSection]);
        setExpandedSections(new Set(['general-section']));
        targetSectionId = 'general-section';
      } else {
        targetSectionId = sections[0].id;
      }
    }

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      sectionId: targetSectionId,
      question: '',
      type: 'PassFailNA',
      required: true,
      safetyCritical: false,
      order: items.filter((i) => i.sectionId === targetSectionId).length,
      photoRequiredOnFail: false,
      failRequiresComment: false,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      // Handle safetyCritical changes: auto-enable and lock failRequiresComment and photoRequiredOnFail
      if (updates.safetyCritical !== undefined) {
        if (updates.safetyCritical) {
          // When enabling Safety Critical, force enable failRequiresComment and photoRequiredOnFail
          updates.failRequiresComment = true;
          updates.photoRequiredOnFail = true;
        }
      }

      // Prevent disabling failRequiresComment or photoRequiredOnFail if safetyCritical is true
      if (item.safetyCritical || (updates.safetyCritical === true)) {
        if (updates.failRequiresComment === false) {
          updates.failRequiresComment = true; // Lock it
        }
        if (updates.photoRequiredOnFail === false) {
          updates.photoRequiredOnFail = true; // Lock it
        }
      }

      // Normalize critical -> safetyCritical for backward compatibility
      if (updates.critical !== undefined && updates.safetyCritical === undefined) {
        updates.safetyCritical = updates.critical;
        delete updates.critical;
      }

      return prev.map((i) => {
        if (i.id === id) {
          const updated = { ...i, ...updates };
          // Ensure backward compatibility: if safetyCritical exists, use it; otherwise check critical
          if (updated.safetyCritical === undefined && (updated as any).critical !== undefined) {
            updated.safetyCritical = (updated as any).critical;
          }
          return updated;
        }
        return i;
      });
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      
      const sectionItems = prev.filter((i) => i.sectionId === item.sectionId).sort((a, b) => a.order - b.order);
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

  const validate = (strict: boolean = false): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!templateName.trim()) {
      newErrors.templateName = 'Template name is required';
    }
    
    if (strict && items.length === 0) {
      newErrors.items = 'At least one checklist item is required';
    }
    
    // Validate Apply Scope
    if (strict) {
      if (applyScope === 'TYPES' && selectedAssetTypeIds.length === 0) {
        newErrors.applyScope = 'Please select at least one asset type';
      }
      if (applyScope === 'ASSETS' && selectedAssetIds.length === 0) {
        newErrors.applyScope = 'Please select at least one asset';
      }
    }
    
    // Validate Template Availability dates
    if (isActive && !startDate) {
      newErrors.startDate = 'Start date is required when template is active';
    }
    
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be on or after start date';
    }
    
    // Validate effective window: if active, ensure dates are valid
    if (isActive && startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      // Start date can be today or in the future (not in the past)
      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }
    
    // Validate Frequency
    if (!frequencyId) {
      newErrors.frequencyId = 'Frequency is required';
    }
    
    for (const item of items) {
      if (!item.question.trim()) {
        newErrors[`item-${item.id}`] = 'Question is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      showToast('Excel template downloaded', 'success');
    } catch (error) {
      console.error('Failed to download template:', error);
      showToast('Failed to download template', 'error');
    }
  };

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast('Please upload a valid Excel file (.xlsx, .xls, or .csv)', 'error');
      return;
    }

    try {
      const { result, meta } = await uploadExcelFile(file);
      
      if (result.errors.length > 0) {
        showToast(`Import failed: ${result.errors.length} error(s) found`, 'error');
        setImportWarnings([...result.errors, ...result.warnings]);
        setShowImportIssues(true);
        return;
      }

      // Handle meta data prefilling
      if (meta) {
        let shouldPrefill = true;
        if (templateName || inspectionType || frequencyId) {
          shouldPrefill = window.confirm(
            'Template already has some fields filled. Do you want to overwrite with imported meta data?'
          );
        }
        
        if (shouldPrefill) {
          if (meta.TemplateName) setTemplateName(meta.TemplateName);
          if (meta.InspectionType) setInspectionType(meta.InspectionType as InspectionType);
          // Frequency is now handled via frequencyId dropdown, skip meta.Frequency
        }
      }

      // Ask user: Replace or Merge
      const shouldReplace = sections.length === 0 && items.length === 0
        ? true
        : window.confirm('Replace current checklist or merge? (Cancel = Merge)');

      // Normalize imported items: ensure safetyCritical exists
      const normalizedItems: ChecklistItem[] = result.items.map((item) => ({
        ...item,
        safetyCritical: item.safetyCritical ?? (item as any).critical ?? false,
        failRequiresComment: item.failRequiresComment ?? (item.safetyCritical ?? (item as any).critical ?? false),
      }));

      if (shouldReplace) {
        setSections(result.sections);
        setItems(normalizedItems);
        setExpandedSections(new Set(result.sections.map((s) => s.id)));
      } else {
        // Merge: append sections, merge items into existing sections
        const existingSectionMap = new Map(sections.map((s) => [s.title, s]));
        const newSections: ChecklistSection[] = [];
        const mergedItems: ChecklistItem[] = [...items];

        result.sections.forEach((section) => {
          if (existingSectionMap.has(section.title)) {
            // Section exists, just add items
            const existingSection = existingSectionMap.get(section.title)!;
            normalizedItems
              .filter((item) => item.sectionId === section.id)
              .forEach((item) => {
                mergedItems.push({
                  ...item,
                  sectionId: existingSection.id,
                });
              });
          } else {
            // New section
            newSections.push(section);
            normalizedItems
              .filter((item) => item.sectionId === section.id)
              .forEach((item) => mergedItems.push(item));
          }
        });

        setSections([...sections, ...newSections]);
        setItems(mergedItems);
        setExpandedSections(new Set([...expandedSections, ...newSections.map((s) => s.id)]));
      }

      // Show summary
      const warningCount = result.warnings.length;
      if (warningCount > 0) {
        setImportWarnings(result.warnings);
        setShowImportIssues(true);
        showToast(`Imported: ${result.sections.length} sections, ${result.items.length} items, ${warningCount} warning(s)`, 'warning');
      } else {
        showToast(`Imported: ${result.sections.length} sections, ${result.items.length} items`, 'success');
      }
    } catch (error: any) {
      console.error('Failed to import template:', error);
      showToast(`Import failed: ${error.message}`, 'error');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveDraft = async () => {
    if (!user) return;
    
    if (!templateName.trim()) {
      showToast('Template name is required', 'error');
      return;
    }
    
    try {
      await createNewTemplate({
        name: templateName,
        description: description || undefined,
        inspectionType,
        assetTypeCode: applyScope === 'TYPES' && selectedAssetTypeIds.length > 0
          ? assetTypes.find((at) => at.id === selectedAssetTypeIds[0])?.code
          : undefined,
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
        isActive: false,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
      });
      
      showToast('Template saved as draft', 'success');
      navigate('/inspections');
    } catch (error) {
      console.error('Failed to create template:', error);
      showToast('Failed to create template', 'error');
    }
  };

  const handlePublish = async () => {
    if (!validate(true)) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    if (!user) return;
    
    // Get frequency snapshot
    const selectedFrequency = frequencies.find((f) => f.id === frequencyId);
    
    setIsPublishing(true);
    try {
      await createNewTemplate({
        name: templateName,
        description: description || undefined,
        inspectionType,
        frequencyId: frequencyId || undefined,
        frequencyName: selectedFrequency ? formatFrequency(selectedFrequency) : undefined,
        frequencyCategory: selectedFrequency?.category,
        frequencyIntervalValue: selectedFrequency?.intervalValue,
        frequencyIntervalUnit: selectedFrequency?.intervalUnit,
        assetTypeCode: applyScope === 'TYPES' && selectedAssetTypeIds.length > 0
          ? assetTypes.find((at) => at.id === selectedAssetTypeIds[0])?.code
          : undefined,
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
        isActive: isActive,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown',
      });
      
      showToast('Template published successfully', 'success');
      navigate('/inspections');
    } catch (error) {
      console.error('Failed to publish template:', error);
      showToast('Failed to publish template', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const groupedItems = (sectionId: string) => {
    return items.filter((item) => item.sectionId === sectionId).sort((a, b) => a.order - b.order);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header with Actions */}
        <PageHeader
          title="Create Inspection Template"
          subtitle="Build a reusable inspection form"
          actions={
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/inspections')}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? 'Publishing...' : 'Publish Template'}
              </Button>
            </div>
          }
        />

        {/* Template Details Card */}
        <Card>
          <div className="p-6 space-y-4">
          {/* Row 1: Template Name */}
          <div>
            <Input
              label="Template Name *"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                if (errors.templateName) {
                  const newErrors = { ...errors };
                  delete newErrors.templateName;
                  setErrors(newErrors);
                }
              }}
              error={errors.templateName}
              placeholder="e.g. MEWP Weekly Inspection"
            />
          </div>

          {/* Row 2: Inspection Type, Frequency, Apply Scope in single row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Select
              label="Frequency *"
              value={frequencyId}
              onChange={(e) => {
                setFrequencyId(e.target.value);
                if (errors.frequencyId) {
                  const newErrors = { ...errors };
                  delete newErrors.frequencyId;
                  setErrors(newErrors);
                }
              }}
              error={errors.frequencyId}
              options={[
                { value: '', label: 'Select frequency...' },
                ...frequencies.map((freq) => ({
                  value: freq.id,
                  label: formatFrequency(freq),
                })),
              ]}
            />
            <Select
              label="Apply Scope *"
              value={applyScope}
              onChange={(e) => {
                setApplyScope(e.target.value as ApplyScope);
                if (errors.applyScope) {
                  const newErrors = { ...errors };
                  delete newErrors.applyScope;
                  setErrors(newErrors);
                }
              }}
              options={[
                { value: 'ALL', label: 'All assets' },
                { value: 'TYPES', label: 'Asset types' },
                { value: 'ASSETS', label: 'Specific assets' },
              ]}
              error={errors.applyScope}
            />
          </div>

          {/* Conditional: Asset Types or Assets Selector */}
          {applyScope === 'TYPES' && (
            <div>
              <SearchableMultiSelect
                label="Select Asset Types *"
                options={assetTypeOptions}
                selected={selectedAssetTypeIds}
                onChange={(selected) => {
                  setSelectedAssetTypeIds(selected);
                  if (errors.applyScope) {
                    const newErrors = { ...errors };
                    delete newErrors.applyScope;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Search and select asset types..."
                error={errors.applyScope}
              />
            </div>
          )}

          {applyScope === 'ASSETS' && (
            <div>
              <SearchableMultiSelect
                label="Select Assets *"
                options={assetOptions}
                selected={selectedAssetIds}
                onChange={(selected) => {
                  setSelectedAssetIds(selected);
                  if (errors.applyScope) {
                    const newErrors = { ...errors };
                    delete newErrors.applyScope;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Search and select assets..."
                error={errors.applyScope}
              />
            </div>
          )}

          {/* Template Availability Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Template Availability</h3>
              {(() => {
                const now = new Date();
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                let status: 'Scheduled' | 'Active' | 'Expired' = 'Active';
                
                if (start && now < start) {
                  status = 'Scheduled';
                } else if (end && now > end) {
                  status = 'Expired';
                } else if (start || end) {
                  status = 'Active';
                }
                
                const badgeVariants = {
                  Scheduled: { variant: 'info' as const, icon: CalendarClock, label: 'Scheduled' },
                  Active: { variant: 'success' as const, icon: CheckCircle2, label: 'Active' },
                  Expired: { variant: 'error' as const, icon: XCircle, label: 'Expired' },
                };
                
                const badge = badgeVariants[status];
                const BadgeIcon = badge.icon;
                
                return (
                  <Badge variant={badge.variant} className="flex items-center gap-1">
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </Badge>
                );
              })()}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DatePicker
                label="Start Date *"
                value={startDate}
                onChange={(value) => {
                  setStartDate(value);
                  // Clear end date error if start date changes
                  if (errors.endDate && endDate && value && new Date(endDate) >= new Date(value)) {
                    const newErrors = { ...errors };
                    delete newErrors.endDate;
                    setErrors(newErrors);
                  }
                }}
                required={isActive}
                error={errors.startDate}
                minDate={new Date()}
              />
              <DatePicker
                label="End Date (Optional)"
                value={endDate}
                onChange={(value) => {
                  setEndDate(value);
                  // Validate end date >= start date
                  if (value && startDate && new Date(value) < new Date(startDate)) {
                    setErrors({ ...errors, endDate: 'End date must be on or after start date' });
                  } else if (errors.endDate) {
                    const newErrors = { ...errors };
                    delete newErrors.endDate;
                    setErrors(newErrors);
                  }
                }}
                error={errors.endDate}
                minDate={startDate ? new Date(startDate) : new Date()}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      setIsActive(e.target.checked);
                      // Validate start date when toggling active
                      if (e.target.checked && !startDate) {
                        setErrors({ ...errors, startDate: 'Start date is required when template is active' });
                      } else if (errors.startDate && startDate) {
                        const newErrors = { ...errors };
                        delete newErrors.startDate;
                        setErrors(newErrors);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Template will only be available for use within the date range when Active is enabled.
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Template description..."
            />
          </div>

          {/* Excel Import/Export */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import / Export (Excel)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel Template
              </Button>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleUploadTemplate}
                  className="hidden"
                  id="excel-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Completed Template
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use Excel to build checklist sections and items, then upload to populate the builder.
            </p>
          </div>
        </div>
      </Card>

      {/* Checklist Builder Card */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Checklist Builder</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add sections and items to build your inspection form.
              </p>
            </div>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.items}</p>
            </div>
          )}

          {/* Sections */}
          {sections.length === 0 && items.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">No checklist items yet</p>
              <div className="flex gap-3 justify-center">
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
          ) : (
            <div className="space-y-3">
              {sections.map((section, sectionIndex) => {
                const sectionItems = groupedItems(section.id);
                const isExpanded = expandedSections.has(section.id);
                
                return (
                  <div key={section.id} className="border border-gray-200 rounded-lg bg-white">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 p-4 bg-gray-50 border-b border-gray-200">
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={sectionIndex === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={sectionIndex === sections.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      </button>
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, e.target.value)}
                        placeholder="Section title"
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}
                      </span>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                        title="Delete section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Section Items */}
                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {sectionItems.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No items in this section. Click "Add Item to Section" below.
                          </div>
                        ) : (
                          sectionItems.map((item, itemIndex, arr) => (
                            <div
                              key={item.id}
                              className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                                {/* Drag Handle */}
                                <div className="lg:col-span-1 flex items-center gap-1">
                                  <button
                                    onClick={() => moveItem(item.id, 'up')}
                                    disabled={itemIndex === 0}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => moveItem(item.id, 'down')}
                                    disabled={itemIndex === arr.length - 1}
                                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Move down"
                                  >
                                    <ArrowDown className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>

                                {/* Question Input */}
                                <div className="lg:col-span-5">
                                  <Input
                                    value={item.question}
                                    onChange={(e) => updateItem(item.id, { question: e.target.value })}
                                    placeholder="e.g. Check hydraulic hose condition"
                                    error={errors[`item-${item.id}`]}
                                  />
                                </div>

                                {/* Type Dropdown */}
                                <div className="lg:col-span-2">
                                  <Select
                                    value={item.type}
                                    onChange={(e) => updateItem(item.id, { type: e.target.value as ChecklistItem['type'] })}
                                    options={[
                                      { value: 'PassFail', label: 'Pass/Fail' },
                                      { value: 'PassFailNA', label: 'Pass/Fail/N/A' },
                                      { value: 'Number', label: 'Number' },
                                      { value: 'Text', label: 'Text' },
                                    ]}
                                  />
                                </div>

                                {/* Conditional Fields */}
                                <div className="lg:col-span-3">
                                  {item.type === 'Number' && (
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        {/* Unit Selector */}
                                        <div className="w-24">
                                          <Select
                                            value={item.unit && STANDARD_UNITS.includes(item.unit as any) ? item.unit : (item.unit ? '__OTHER__' : '')}
                                            onChange={(e) => {
                                              if (e.target.value === '__OTHER__') {
                                                // Keep current unit if it's already a custom one
                                                if (!item.unit || STANDARD_UNITS.includes(item.unit as any)) {
                                                  updateItem(item.id, { unit: '' });
                                                }
                                              } else if (e.target.value) {
                                                updateItem(item.id, { unit: e.target.value });
                                              } else {
                                                updateItem(item.id, { unit: undefined });
                                              }
                                            }}
                                            options={[
                                              { value: '', label: 'No unit' },
                                              ...UNIT_OPTIONS,
                                            ]}
                                          />
                                        </div>
                                        {/* Custom Unit Input (shown when "Other" is selected) */}
                                        {item.unit && !STANDARD_UNITS.includes(item.unit as any) && (
                                          <Input
                                            type="text"
                                            placeholder="Custom unit"
                                            value={item.unit}
                                            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                                            className="w-24 text-sm"
                                            autoFocus
                                          />
                                        )}
                                        <Input
                                          type="number"
                                          placeholder="Min"
                                          value={item.minValue?.toString() || ''}
                                          onChange={(e) => {
                                            const min = e.target.value ? parseFloat(e.target.value) : undefined;
                                            const max = item.maxValue;
                                            if (min !== undefined && max !== undefined && min > max) {
                                              // Will show validation error
                                            }
                                            updateItem(item.id, { minValue: min });
                                          }}
                                          className="w-20 text-sm"
                                        />
                                        <Input
                                          type="number"
                                          placeholder="Max"
                                          value={item.maxValue?.toString() || ''}
                                          onChange={(e) => {
                                            const max = e.target.value ? parseFloat(e.target.value) : undefined;
                                            const min = item.minValue;
                                            if (min !== undefined && max !== undefined && min > max) {
                                              // Will show validation error
                                            }
                                            updateItem(item.id, { maxValue: max });
                                          }}
                                          className="w-20 text-sm"
                                        />
                                      </div>
                                      {/* Min/Max Validation Error */}
                                      {item.minValue !== undefined && item.maxValue !== undefined && item.minValue > item.maxValue && (
                                        <p className="text-xs text-red-600">Min cannot be greater than Max</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Toggles */}
                                <div className="lg:col-span-1 flex flex-col gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.required}
                                      onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-700">Required</span>
                                  </label>
                                  <div className="space-y-1">
                                    <label 
                                      className={`flex items-center gap-2 ${(item.type === 'PassFail' || item.type === 'PassFailNA') ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                      title={
                                        (item.type === 'PassFail' || item.type === 'PassFailNA')
                                          ? 'Safety-critical items represent a risk to people, plant, or environment if they fail.'
                                          : 'Safety-critical applies to Pass/Fail checks only.'
                                      }
                                    >
                                      <input
                                        type="checkbox"
                                        checked={item.safetyCritical || (item as any).critical || false}
                                        onChange={(e) => {
                                          if (item.type === 'PassFail' || item.type === 'PassFailNA') {
                                            updateItem(item.id, { safetyCritical: e.target.checked });
                                          }
                                        }}
                                        disabled={item.type !== 'PassFail' && item.type !== 'PassFailNA'}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                                      />
                                      <span className="text-xs text-gray-700">Safety Critical</span>
                                      <Info className="w-3 h-3 text-gray-400" />
                                    </label>
                                    {(item.type !== 'PassFail' && item.type !== 'PassFailNA') && (
                                      <p className="text-xs text-gray-500 ml-6">Applies to Pass/Fail only</p>
                                    )}
                                    {(item.safetyCritical || (item as any).critical) && (
                                      <p className="text-xs text-blue-600 ml-6 font-medium">
                                        Failures require comment and photo
                                      </p>
                                    )}
                                  </div>
                                  {(item.type === 'PassFail' || item.type === 'PassFailNA') && (
                                    <label className={`flex items-center gap-2 ${(item.safetyCritical || (item as any).critical) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                      <input
                                        type="checkbox"
                                        checked={item.failRequiresComment || false}
                                        onChange={(e) => {
                                          if (!(item.safetyCritical || (item as any).critical)) {
                                            updateItem(item.id, { failRequiresComment: e.target.checked });
                                          }
                                        }}
                                        disabled={item.safetyCritical || (item as any).critical}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                                      />
                                      <span className="text-xs text-gray-700">Fail Requires Comment</span>
                                      {(item.safetyCritical || (item as any).critical) && (
                                        <span className="text-xs text-gray-500">(Required)</span>
                                      )}
                                    </label>
                                  )}
                                  <label className={`flex items-center gap-2 ${(item.safetyCritical || (item as any).critical) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                    <input
                                      type="checkbox"
                                      checked={item.photoRequiredOnFail}
                                      onChange={(e) => {
                                        if (!(item.safetyCritical || (item as any).critical)) {
                                          updateItem(item.id, { photoRequiredOnFail: e.target.checked });
                                        }
                                      }}
                                      disabled={item.safetyCritical || (item as any).critical}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <span className="text-xs text-gray-700">Photo on Fail</span>
                                    {(item.safetyCritical || (item as any).critical) && (
                                      <span className="text-xs text-gray-500">(Required)</span>
                                    )}
                                  </label>
                                </div>
                              </div>

                              {/* Delete Button */}
                              <div className="mt-3 flex justify-end">
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Item
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addItem(section.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Item to Section
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Import Issues Modal */}
      <Modal
        isOpen={showImportIssues}
        onClose={() => setShowImportIssues(false)}
        title="Import Issues"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The following issues were found during import:
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {importWarnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Row {warning.row}
                  </p>
                  <p className="text-sm text-yellow-700">{warning.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowImportIssues(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
