import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Textarea } from '../../../components/common/Textarea';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { mockSites } from '../../assets/services';
import { createFitterHandover, updateFitterHandover, getFitterHandoverById, submitFitterHandover } from '../services';
import { showToast } from '../../../components/common/Toast';
import { EvidenceUploader, type EvidenceFile } from './EvidenceUploader';
import type { Personnel, MaterialItem, Task, ShiftType } from '../types';

interface CreateHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editId?: string;
}

// Mock data for autocomplete
const mockPersonnelNames = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emma Wilson', 'Tom Brown', 'Lisa Anderson', 'David Lee', 'Rachel Green'];
const locations = ['Yard 1', 'Yard 2', 'Workshop', 'Field 1', 'Field 2', 'Storage', 'Office', 'Site A', 'Site B'];
const occupations = ['Fitter', 'Welder', 'Chargehand', 'Supervisor', 'Operator', 'Technician', 'Foreman'];
const shiftPatterns = ['5-2', '7-3', '7N-4', '4-4', '6-3', 'Custom'];
const materialUnits = ['pcs', 'kg', 'L', 'm', 'm²', 'm³', 'box', 'roll', 'sheet'];

export function CreateHandoverModal({ isOpen, onClose, onSuccess, editId }: CreateHandoverModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    siteId: '',
    date: new Date().toISOString().split('T')[0],
    shiftType: 'Days' as ShiftType,
    shiftPattern: '5-2',
    locations: [] as string[],
    personnel: [] as Personnel[],
    tasksCompleted: [] as Task[],
    shiftComments: '',
    materialsUsed: [] as MaterialItem[],
    materialsRequired: [] as MaterialItem[],
    nextShiftNotes: '',
    photos: [] as EvidenceFile[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLocation, setSelectedLocation] = useState('');
  const [personnelSearch, setPersonnelSearch] = useState<Record<number, string>>({});
  const [personnelSuggestions, setPersonnelSuggestions] = useState<Record<number, string[]>>({});

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isOpen || editId) return;
    
    const autoSaveInterval = setInterval(() => {
      if (formData.siteId && formData.date) {
        handleAutoSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isOpen, formData, editId]);

  useEffect(() => {
    if (isOpen) {
      if (editId) {
        const existing = getFitterHandoverById(editId);
        if (existing) {
          setFormData({
            siteId: existing.siteId,
            date: existing.date,
            shiftType: existing.shiftType,
            shiftPattern: existing.shiftPattern,
            locations: existing.locations,
            personnel: existing.personnel || [],
            tasksCompleted: existing.tasksCompleted || [],
            shiftComments: existing.shiftComments,
            materialsUsed: existing.materialsUsed,
            materialsRequired: existing.materialsRequired,
            nextShiftNotes: existing.nextShiftNotes || '',
            photos: [],
          });
        }
      } else {
        // Reset form - check for prefilled data from navigation state
        const state = location.state as { prefilledSite?: string; prefilledShiftPattern?: string } | null;
        setFormData({
          siteId: state?.prefilledSite || user?.siteIds?.[0] || '',
          date: new Date().toISOString().split('T')[0],
          shiftType: 'Days',
          shiftPattern: state?.prefilledShiftPattern || '5-2',
          locations: [],
          personnel: [],
          tasksCompleted: [],
          shiftComments: '',
          materialsUsed: [],
          materialsRequired: [],
          nextShiftNotes: '',
          photos: [],
        });
      }
      setErrors({});
      setSelectedLocation('');
      setPersonnelSearch({});
      setPersonnelSuggestions({});
    }
  }, [isOpen, editId, user]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      formData.photos.forEach((photo) => {
        if (photo.preview.startsWith('blob:')) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, []);

  const handleAutoSave = () => {
    if (!user || !formData.siteId || !formData.date) return;
    
    const site = mockSites.find(s => s.id === formData.siteId);
    if (!site) return;

    const handoverData = {
      siteId: formData.siteId,
      siteName: site.name,
      date: formData.date,
      shiftType: formData.shiftType,
      shiftPattern: formData.shiftPattern,
      fitterUserId: user.id,
      fitterName: `${user.firstName} ${user.lastName}`,
      locations: formData.locations,
      personnel: formData.personnel.length > 0 ? formData.personnel : undefined,
      tasksCompleted: formData.tasksCompleted.length > 0 ? formData.tasksCompleted : undefined,
      shiftComments: formData.shiftComments,
      materialsUsed: formData.materialsUsed.filter(m => m.item.trim()),
      materialsRequired: formData.materialsRequired.filter(m => m.item.trim()),
      nextShiftNotes: formData.nextShiftNotes || undefined,
      attachments: formData.photos.map(p => ({
        id: p.id,
        name: p.file.name,
        type: 'image',
      })),
      status: 'Draft' as const,
    };

    if (editId) {
      updateFitterHandover(editId, handoverData);
    } else {
      // Auto-save creates draft silently
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddLocation = () => {
    if (selectedLocation && !formData.locations.includes(selectedLocation)) {
      handleFieldChange('locations', [...formData.locations, selectedLocation]);
      setSelectedLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    handleFieldChange('locations', formData.locations.filter(l => l !== location));
  };

  // Personnel with autocomplete
  const handlePersonnelSearch = (index: number, value: string) => {
    setPersonnelSearch(prev => ({ ...prev, [index]: value }));
    
    if (value.length > 0) {
      const filtered = mockPersonnelNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setPersonnelSuggestions(prev => ({ ...prev, [index]: filtered }));
    } else {
      setPersonnelSuggestions(prev => ({ ...prev, [index]: [] }));
    }
  };

  const handleSelectPersonnel = (index: number, name: string) => {
    const updated = [...formData.personnel];
    updated[index] = { ...updated[index], name };
    handleFieldChange('personnel', updated);
    setPersonnelSearch(prev => ({ ...prev, [index]: name }));
    setPersonnelSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const handleAddPersonnel = () => {
    handleFieldChange('personnel', [
      ...formData.personnel,
      { name: '', occupation: occupations[0], location: '', remarks: '' },
    ]);
  };

  const handleUpdatePersonnel = (index: number, field: keyof Personnel, value: string) => {
    const updated = [...formData.personnel];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('personnel', updated);
  };

  const handleRemovePersonnel = (index: number) => {
    handleFieldChange('personnel', formData.personnel.filter((_, i) => i !== index));
    setPersonnelSearch(prev => {
      const newSearch = { ...prev };
      delete newSearch[index];
      return newSearch;
    });
  };

  // Tasks
  const handleAddTask = () => {
    handleFieldChange('tasksCompleted', [
      ...formData.tasksCompleted,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: '',
        location: '',
        assetReference: '',
        status: 'Completed',
        requiresFollowUp: false,
      },
    ]);
  };

  const handleUpdateTask = (index: number, field: keyof Task, value: any) => {
    const updated = [...formData.tasksCompleted];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('tasksCompleted', updated);
  };

  const handleRemoveTask = (index: number) => {
    handleFieldChange('tasksCompleted', formData.tasksCompleted.filter((_, i) => i !== index));
  };

  // Materials
  const handleAddMaterial = (type: 'used' | 'required') => {
    if (type === 'used') {
      handleFieldChange('materialsUsed', [...formData.materialsUsed, { item: '', qty: '', unit: 'pcs', notes: '' }]);
    } else {
      handleFieldChange('materialsRequired', [...formData.materialsRequired, { item: '', qty: '', unit: 'pcs', notes: '' }]);
    }
  };

  const handleUpdateMaterial = (type: 'used' | 'required', index: number, field: keyof MaterialItem, value: string) => {
    if (type === 'used') {
      const updated = [...formData.materialsUsed];
      updated[index] = { ...updated[index], [field]: value };
      handleFieldChange('materialsUsed', updated);
    } else {
      const updated = [...formData.materialsRequired];
      updated[index] = { ...updated[index], [field]: value };
      handleFieldChange('materialsRequired', updated);
    }
  };

  const handleRemoveMaterial = (type: 'used' | 'required', index: number) => {
    if (type === 'used') {
      handleFieldChange('materialsUsed', formData.materialsUsed.filter((_, i) => i !== index));
    } else {
      handleFieldChange('materialsRequired', formData.materialsRequired.filter((_, i) => i !== index));
    }
  };

  // Photos - handled by EvidenceUploader component
  const handlePhotosChange = (newPhotos: EvidenceFile[]) => {
    handleFieldChange('photos', newPhotos);
  };

  const handleUpdatePhoto = (index: number, field: 'caption' | 'location' | 'linkedTaskId', value: string) => {
    const updated = [...formData.photos];
    updated[index] = { ...updated[index], [field]: value };
    handleFieldChange('photos', updated);
  };

  const handleRemovePhoto = (index: number) => {
    const photoToRemove = formData.photos[index];
    // Revoke object URL to prevent memory leak
    if (photoToRemove && photoToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    handleFieldChange('photos', formData.photos.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.siteId) {
      newErrors.siteId = 'Site is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (formData.locations.length === 0) {
      newErrors.locations = 'At least one location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;
    if (!user) return;

    const site = mockSites.find(s => s.id === formData.siteId);
    if (!site) {
      showToast('Selected site not found', 'error');
      return;
    }

    const handoverData = {
      siteId: formData.siteId,
      siteName: site.name,
      date: formData.date,
      shiftType: formData.shiftType,
      shiftPattern: formData.shiftPattern,
      fitterUserId: user.id,
      fitterName: `${user.firstName} ${user.lastName}`,
      locations: formData.locations,
      personnel: formData.personnel.length > 0 ? formData.personnel : undefined,
      tasksCompleted: formData.tasksCompleted.length > 0 ? formData.tasksCompleted : undefined,
      shiftComments: formData.shiftComments,
      materialsUsed: formData.materialsUsed.filter(m => m.item.trim()),
      materialsRequired: formData.materialsRequired.filter(m => m.item.trim()),
      nextShiftNotes: formData.nextShiftNotes || undefined,
      attachments: formData.photos.map(p => ({
        id: p.id,
        name: p.file.name,
        type: 'image',
      })),
      status: 'Draft' as const,
    };

    if (editId) {
      const result = updateFitterHandover(editId, handoverData);
      if (result) {
        showToast('Handover saved as draft', 'success');
        onSuccess?.();
        onClose();
      }
    } else {
      createFitterHandover(handoverData);
      showToast('Handover saved as draft', 'success');
      onSuccess?.();
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (!user) return;

    const site = mockSites.find(s => s.id === formData.siteId);
    if (!site) {
      showToast('Selected site not found', 'error');
      return;
    }

    const handoverData = {
      siteId: formData.siteId,
      siteName: site.name,
      date: formData.date,
      shiftType: formData.shiftType,
      shiftPattern: formData.shiftPattern,
      fitterUserId: user.id,
      fitterName: `${user.firstName} ${user.lastName}`,
      locations: formData.locations,
      personnel: formData.personnel.length > 0 ? formData.personnel : undefined,
      tasksCompleted: formData.tasksCompleted.length > 0 ? formData.tasksCompleted : undefined,
      shiftComments: formData.shiftComments,
      materialsUsed: formData.materialsUsed.filter(m => m.item.trim()),
      materialsRequired: formData.materialsRequired.filter(m => m.item.trim()),
      nextShiftNotes: formData.nextShiftNotes || undefined,
      attachments: formData.photos.map(p => ({
        id: p.id,
        name: p.file.name,
        type: 'image',
      })),
      status: 'Submitted' as const,
    };

    if (editId) {
      const updated = updateFitterHandover(editId, handoverData);
      if (updated) {
        submitFitterHandover(editId);
        onSuccess?.();
        onClose();
        // Navigate to submitted page
        navigate(`/handovers/submitted/${editId}`);
      }
    } else {
      const created = createFitterHandover(handoverData);
      submitFitterHandover(created.id);
      onSuccess?.();
      onClose();
      // Navigate to submitted page
      navigate(`/handovers/submitted/${created.id}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editId ? 'Edit Handover' : 'Create Handover'}
      size="xl"
    >
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto pb-24">
        <div className="space-y-6">
          {/* Section 1: Basics */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Site"
                value={formData.siteId}
                onChange={(e) => handleFieldChange('siteId', e.target.value)}
                options={[
                  { value: '', label: 'Select site...' },
                  ...mockSites.map(site => ({ value: site.id, label: site.name })),
                ]}
                error={errors.siteId}
                required
              />
              <Input
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                error={errors.date}
                required
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

            {/* Locations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locations <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  options={[
                    { value: '', label: 'Select location...' },
                    ...locations.filter(loc => !formData.locations.includes(loc)).map(loc => ({ value: loc, label: loc })),
                  ]}
                  className="flex-1"
                />
                <Button onClick={handleAddLocation} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              {errors.locations && <p className="text-sm text-red-600 mt-1">{errors.locations}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.locations.map(location => (
                  <div key={location} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {location}
                    <button
                      onClick={() => handleRemoveLocation(location)}
                      className="hover:text-red-600 ml-1 flex items-center"
                      type="button"
                      aria-label={`Remove ${location}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Personnel (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">Personnel (Optional)</h3>
              <Button onClick={handleAddPersonnel} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Personnel
              </Button>
            </div>
            {formData.personnel.map((person, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Input
                      placeholder="Name (type to search)"
                      value={personnelSearch[index] || person.name}
                      onChange={(e) => {
                        handlePersonnelSearch(index, e.target.value);
                        handleUpdatePersonnel(index, 'name', e.target.value);
                      }}
                    />
                    {personnelSuggestions[index] && personnelSuggestions[index].length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {personnelSuggestions[index].map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleSelectPersonnel(index, name)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Select
                    value={person.occupation}
                    onChange={(e) => handleUpdatePersonnel(index, 'occupation', e.target.value)}
                    options={occupations.map(occ => ({ value: occ, label: occ }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Location (optional)"
                    value={person.location || ''}
                    onChange={(e) => handleUpdatePersonnel(index, 'location', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Remarks (optional)"
                      value={person.remarks || ''}
                      onChange={(e) => handleUpdatePersonnel(index, 'remarks', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleRemovePersonnel(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 3: Tasks Completed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">Tasks Completed</h3>
              <Button onClick={handleAddTask} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
            {formData.tasksCompleted.map((task, index) => (
              <div key={task.id} className="p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                <Input
                  placeholder="Task description"
                  value={task.description}
                  onChange={(e) => handleUpdateTask(index, 'description', e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Location (optional)"
                    value={task.location || ''}
                    onChange={(e) => handleUpdateTask(index, 'location', e.target.value)}
                  />
                  <Input
                    placeholder="Asset reference (optional)"
                    value={task.assetReference || ''}
                    onChange={(e) => handleUpdateTask(index, 'assetReference', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={task.status}
                    onChange={(e) => handleUpdateTask(index, 'status', e.target.value as 'Completed' | 'PartiallyCompleted')}
                    options={[
                      { value: 'Completed', label: 'Completed' },
                      { value: 'PartiallyCompleted', label: 'Partially Completed' },
                    ]}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.requiresFollowUp}
                      onChange={(e) => handleUpdateTask(index, 'requiresFollowUp', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Requires follow-up</span>
                  </label>
                  <Button
                    onClick={() => handleRemoveTask(index)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4: Shift Comments */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Shift Comments</h3>
            <Textarea
              value={formData.shiftComments}
              onChange={(e) => handleFieldChange('shiftComments', e.target.value)}
              placeholder="General notes about the shift, issues encountered, or work context."
              rows={6}
              className="min-h-[120px]"
            />
          </div>

          {/* Section 5: Photos & Evidence */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">Photos & Evidence</h3>
              <p className="text-sm text-gray-600 mt-1">Upload photos showing work completed, site condition, or issues.</p>
            </div>
            
            {/* Drag & Drop Upload Zone */}
            <EvidenceUploader
              files={formData.photos}
              onFilesChange={handlePhotosChange}
              maxFiles={10}
              maxFileSizeMB={10}
              accept="image/*"
            />

            {/* Photo Previews with Metadata */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={photo.id} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={photo.preview}
                        alt={photo.file.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                        aria-label={`Remove ${photo.file.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-xs text-white bg-black bg-opacity-50 rounded px-1 truncate">
                          {photo.file.name}
                        </p>
                      </div>
                    </div>
                    <Input
                      placeholder="Caption (optional)"
                      value={photo.caption || ''}
                      onChange={(e) => handleUpdatePhoto(index, 'caption', e.target.value)}
                    />
                    <Input
                      placeholder="Location (optional)"
                      value={photo.location || ''}
                      onChange={(e) => handleUpdatePhoto(index, 'location', e.target.value)}
                    />
                    {formData.tasksCompleted.length > 0 && (
                      <Select
                        value={photo.linkedTaskId || ''}
                        onChange={(e) => handleUpdatePhoto(index, 'linkedTaskId', e.target.value)}
                        options={[
                          { value: '', label: 'Link to task (optional)' },
                          ...formData.tasksCompleted.map((task, idx) => ({
                            value: task.id,
                            label: task.description || `Task ${idx + 1}`,
                          })),
                        ]}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Materials Used */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">Materials Used (Optional)</h3>
              <Button onClick={() => handleAddMaterial('used')} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>
            {formData.materialsUsed.map((material, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-3 border border-gray-200">
                <Input
                  placeholder="Material name"
                  value={material.item}
                  onChange={(e) => handleUpdateMaterial('used', index, 'item', e.target.value)}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="Quantity"
                  value={material.qty || ''}
                  onChange={(e) => handleUpdateMaterial('used', index, 'qty', e.target.value)}
                />
                <div className="flex gap-2">
                  <Select
                    value={material.unit || 'pcs'}
                    onChange={(e) => handleUpdateMaterial('used', index, 'unit', e.target.value)}
                    options={materialUnits.map(unit => ({ value: unit, label: unit }))}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleRemoveMaterial('used', index)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={material.notes || ''}
                  onChange={(e) => handleUpdateMaterial('used', index, 'notes', e.target.value)}
                  className="md:col-span-full"
                />
              </div>
            ))}
          </div>

          {/* Section 7: Materials Required Next Shift */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-semibold text-gray-900">Materials Required Next Shift (Optional)</h3>
              <Button onClick={() => handleAddMaterial('required')} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>
            {formData.materialsRequired.map((material, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-3 border border-gray-200">
                <Input
                  placeholder="Material name"
                  value={material.item}
                  onChange={(e) => handleUpdateMaterial('required', index, 'item', e.target.value)}
                  className="md:col-span-2"
                />
                <Input
                  placeholder="Quantity"
                  value={material.qty || ''}
                  onChange={(e) => handleUpdateMaterial('required', index, 'qty', e.target.value)}
                />
                <div className="flex gap-2">
                  <Select
                    value={material.unit || 'pcs'}
                    onChange={(e) => handleUpdateMaterial('required', index, 'unit', e.target.value)}
                    options={materialUnits.map(unit => ({ value: unit, label: unit }))}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleRemoveMaterial('required', index)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={material.notes || ''}
                  onChange={(e) => handleUpdateMaterial('required', index, 'notes', e.target.value)}
                  className="md:col-span-full"
                />
              </div>
            ))}
          </div>

          {/* Section 8: Next Shift Notes */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Next Shift Notes</h3>
            <Textarea
              value={formData.nextShiftNotes}
              onChange={(e) => handleFieldChange('nextShiftNotes', e.target.value)}
              placeholder="Direct instructions or warnings for the next shift. Highlight unfinished work or hazards."
              rows={4}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 -mx-6 -mb-6 mt-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} className="w-full sm:w-auto">
            Save Draft
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
