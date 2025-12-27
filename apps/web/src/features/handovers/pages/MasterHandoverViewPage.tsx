import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Textarea } from '../../../components/common/Textarea';
import { ArrowLeft, CheckCircle, Link as LinkIcon, Download, FileText, Plus, Trash2, Edit, X } from 'lucide-react';
import {
  getMasterHandoverById,
  submitMasterToManagement,
  acknowledgeMaster,
  updateMasterHandover,
  getFitterHandoverById,
} from '../services';
import { showToast } from '../../../components/common/Toast';
import type { MasterHandover, Personnel, MasterHandoverSection, MaterialItem } from '../types';

export function MasterHandoverViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [master, setMaster] = useState<MasterHandover | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitTo, setSubmitTo] = useState('');
  const [editingPersonnelIndex, setEditingPersonnelIndex] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newPersonnel, setNewPersonnel] = useState<Personnel>({ name: '', occupation: '', location: '', remarks: '' });
  const [newSection, setNewSection] = useState<Omit<MasterHandoverSection, 'id'>>({ name: '', tasks: [], issues: [], notes: '', materialsUsed: [], materialsRequired: [] });

  useEffect(() => {
    if (id) {
      const found = getMasterHandoverById(id);
      setMaster(found || null);
    }
  }, [id]);

  if (!master) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Master handover not found</p>
          <Button onClick={() => navigate('/handovers')} className="mt-4">
            Back to Handovers
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = ['Supervisor', 'Admin'].includes(user?.role || '') && master.status === 'Draft';
  const canSubmit = ['Supervisor', 'Admin'].includes(user?.role || '') && master.status === 'Draft';
  const canAcknowledge = ['Manager', 'Admin'].includes(user?.role || '') && master.status === 'SubmittedToManagement';
  const isReadOnly = master.status !== 'Draft';

  const handleSubmit = () => {
    if (!submitTo.trim()) {
      showToast('Please enter recipient email', 'error');
      return;
    }
    const result = submitMasterToManagement(master.id, submitTo);
    if (result) {
      setMaster(result);
      setIsSubmitModalOpen(false);
      setSubmitTo('');
      showToast('Master handover submitted to management', 'success');
    }
  };

  const handleAcknowledge = () => {
    if (!user) return;
    const result = acknowledgeMaster(master.id, user.id, `${user.firstName} ${user.lastName}`);
    if (result) {
      setMaster(result);
      showToast('Master handover acknowledged', 'success');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/handovers/master/${master.id}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied to clipboard', 'success');
  };

  const handleExportPDF = () => {
    // MVP: Open print dialog
    window.print();
    showToast('Opening print dialog...', 'info');
  };

  const handleUpdateSummary = (summary: string) => {
    if (!canEdit) return;
    const result = updateMasterHandover(master.id, { compiledSummary: summary });
    if (result) {
      setMaster(result);
    }
  };

  const handleUpdateOverarchingComments = (comments: string) => {
    if (!canEdit) return;
    const result = updateMasterHandover(master.id, { overarchingComments: comments });
    if (result) {
      setMaster(result);
    }
  };

  // Personnel management
  const handleAddPersonnel = () => {
    if (!newPersonnel.name || !newPersonnel.occupation) {
      showToast('Please enter name and occupation', 'error');
      return;
    }
    const updated = [...(master.personnel || []), newPersonnel];
    const result = updateMasterHandover(master.id, { personnel: updated });
    if (result) {
      setMaster(result);
      setNewPersonnel({ name: '', occupation: '', location: '', remarks: '' });
    }
  };

  const handleUpdatePersonnel = (index: number, updated: Personnel) => {
    const personnel = [...(master.personnel || [])];
    personnel[index] = updated;
    const result = updateMasterHandover(master.id, { personnel });
    if (result) {
      setMaster(result);
      setEditingPersonnelIndex(null);
    }
  };

  const handleRemovePersonnel = (index: number) => {
    const personnel = [...(master.personnel || [])];
    personnel.splice(index, 1);
    const result = updateMasterHandover(master.id, { personnel });
    if (result) {
      setMaster(result);
    }
  };

  // Section management
  const handleAddSection = () => {
    if (!newSection.name.trim()) {
      showToast('Please enter section name', 'error');
      return;
    }
    const section: MasterHandoverSection = {
      ...newSection,
      id: `section-${Date.now()}`,
    };
    const updated = [...(master.sections || []), section];
    const result = updateMasterHandover(master.id, { sections: updated });
    if (result) {
      setMaster(result);
      setNewSection({ name: '', tasks: [], issues: [], notes: '', materialsUsed: [], materialsRequired: [] });
    }
  };

  const handleUpdateSection = (sectionId: string, updated: MasterHandoverSection) => {
    const sections = [...(master.sections || [])];
    const index = sections.findIndex(s => s.id === sectionId);
    if (index !== -1) {
      sections[index] = updated;
      const result = updateMasterHandover(master.id, { sections });
      if (result) {
        setMaster(result);
        setEditingSectionId(null);
      }
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    const sections = (master.sections || []).filter(s => s.id !== sectionId);
    const result = updateMasterHandover(master.id, { sections });
    if (result) {
      setMaster(result);
    }
  };

  const getStatusBadge = (status: MasterHandover['status']) => {
    const variants: Record<MasterHandover['status'], 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      Draft: 'default',
      SubmittedToManagement: 'info',
      Acknowledged: 'success',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  // Get included handovers
  const includedHandovers = master.includedHandoverIds
    .map(id => getFitterHandoverById(id))
    .filter(Boolean);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/handovers')} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{master.id}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {master.siteName} • {new Date(master.date).toLocaleDateString()} • {master.shiftType} • {master.supervisorName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(master.status)}
          <Button onClick={handleCopyLink} variant="outline" size="sm">
            <LinkIcon className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          {canSubmit && (
            <Button onClick={() => setIsSubmitModalOpen(true)} variant="primary" size="sm">
              Submit to Management
            </Button>
          )}
          {canAcknowledge && (
            <Button onClick={handleAcknowledge} variant="primary" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Acknowledge
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personnel */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Personnel</h2>
                {canEdit && (
                  <Button onClick={handleAddPersonnel} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Personnel
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {(master.personnel || []).map((person, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border border-gray-200">
                    {editingPersonnelIndex === index ? (
                      <div className="space-y-2">
                        <Input
                          value={person.name}
                          onChange={(e) => handleUpdatePersonnel(index, { ...person, name: e.target.value })}
                          placeholder="Name"
                          className="text-sm"
                        />
                        <Input
                          value={person.occupation}
                          onChange={(e) => handleUpdatePersonnel(index, { ...person, occupation: e.target.value })}
                          placeholder="Occupation"
                          className="text-sm"
                        />
                        <Input
                          value={person.location || ''}
                          onChange={(e) => handleUpdatePersonnel(index, { ...person, location: e.target.value })}
                          placeholder="Location (optional)"
                          className="text-sm"
                        />
                        <Input
                          value={person.remarks || ''}
                          onChange={(e) => handleUpdatePersonnel(index, { ...person, remarks: e.target.value })}
                          placeholder="Remarks (optional)"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => setEditingPersonnelIndex(null)} size="sm" variant="outline">
                            Done
                          </Button>
                          <Button onClick={() => handleRemovePersonnel(index)} size="sm" variant="outline">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{person.name}</div>
                          <div className="text-sm text-gray-600">{person.occupation}</div>
                          {person.location && <div className="text-xs text-gray-500">Location: {person.location}</div>}
                          {person.remarks && <div className="text-xs text-gray-500 mt-1">{person.remarks}</div>}
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <Button onClick={() => setEditingPersonnelIndex(index)} size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleRemovePersonnel(index)} size="sm" variant="outline">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <div className="p-3 border-2 border-dashed border-gray-300 rounded">
                    <div className="space-y-2">
                      <Input
                        value={newPersonnel.name}
                        onChange={(e) => setNewPersonnel({ ...newPersonnel, name: e.target.value })}
                        placeholder="Name"
                        className="text-sm"
                      />
                      <Input
                        value={newPersonnel.occupation}
                        onChange={(e) => setNewPersonnel({ ...newPersonnel, occupation: e.target.value })}
                        placeholder="Occupation"
                        className="text-sm"
                      />
                      <Input
                        value={newPersonnel.location || ''}
                        onChange={(e) => setNewPersonnel({ ...newPersonnel, location: e.target.value })}
                        placeholder="Location (optional)"
                        className="text-sm"
                      />
                      <Input
                        value={newPersonnel.remarks || ''}
                        onChange={(e) => setNewPersonnel({ ...newPersonnel, remarks: e.target.value })}
                        placeholder="Remarks (optional)"
                        className="text-sm"
                      />
                      <Button onClick={handleAddPersonnel} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Sections */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Work Sections</h2>
                {canEdit && (
                  <Button onClick={handleAddSection} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {(master.sections || []).map((section) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    canEdit={canEdit}
                    onUpdate={(updated) => handleUpdateSection(section.id, updated)}
                    onRemove={() => handleRemoveSection(section.id)}
                  />
                ))}
                {canEdit && (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded">
                    <Input
                      value={newSection.name}
                      onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                      placeholder="Section name (e.g., Tunnels, Surface, SEL)"
                      className="mb-2"
                    />
                    <Button onClick={handleAddSection} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Overarching Comments */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Overarching Comments</h2>
              {canEdit ? (
                <Textarea
                  value={master.overarchingComments || ''}
                  onChange={(e) => handleUpdateOverarchingComments(e.target.value)}
                  placeholder="Enter overarching comments for management review..."
                  rows={6}
                />
              ) : (
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{master.overarchingComments || 'No overarching comments'}</p>
              )}
            </div>
          </Card>

          {/* Compiled Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Compiled Summary</h2>
              {canEdit ? (
                <Textarea
                  value={master.compiledSummary}
                  onChange={(e) => handleUpdateSummary(e.target.value)}
                  placeholder="Enter compiled summary..."
                  rows={10}
                />
              ) : (
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{master.compiledSummary}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Included Handovers */}
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-2">Included Handovers ({includedHandovers.length})</h3>
              <div className="space-y-2">
                {includedHandovers.map(handover => (
                  <div
                    key={handover.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer text-xs"
                    onClick={() => navigate(`/handovers/${handover.id}`)}
                  >
                    <div>
                      <div className="font-medium">{handover.id}</div>
                      <div className="text-gray-500">{handover.fitterName}</div>
                    </div>
                    <Badge variant="info" size="sm">{handover.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Distribution Log */}
          {master.distributionLog.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-semibold mb-2">Distribution Log</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  {master.distributionLog.map((log, idx) => (
                    <div key={idx}>
                      <div className="font-medium">{log.sentTo}</div>
                      <div>{new Date(log.sentAt).toLocaleString()}</div>
                      <div className="text-gray-500">{log.method}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-2">Metadata</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div>Created: {new Date(master.createdAt).toLocaleString()}</div>
                <div>Updated: {new Date(master.updatedAt).toLocaleString()}</div>
                <div>Supervisor: {master.supervisorName}</div>
                <div>Included: {master.includedHandoverIds.length} handover(s)</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSubmitTo('');
        }}
        title="Submit to Management"
      >
        <div className="space-y-4">
          <Input
            label="Recipient Email"
            type="email"
            value={submitTo}
            onChange={(e) => setSubmitTo(e.target.value)}
            placeholder="management@example.com"
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitModalOpen(false);
                setSubmitTo('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!submitTo.trim()}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Section Editor Component
function SectionEditor({
  section,
  canEdit,
  onUpdate,
  onRemove,
}: {
  section: MasterHandoverSection;
  canEdit: boolean;
  onUpdate: (section: MasterHandoverSection) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(section);

  const handleSave = () => {
    onUpdate(edited);
    setIsEditing(false);
  };

  const addTask = () => {
    setEdited({ ...edited, tasks: [...edited.tasks, ''] });
  };

  const updateTask = (index: number, value: string) => {
    const tasks = [...edited.tasks];
    tasks[index] = value;
    setEdited({ ...edited, tasks });
  };

  const removeTask = (index: number) => {
    const tasks = edited.tasks.filter((_, i) => i !== index);
    setEdited({ ...edited, tasks });
  };

  const addIssue = () => {
    setEdited({ ...edited, issues: [...edited.issues, ''] });
  };

  const updateIssue = (index: number, value: string) => {
    const issues = [...edited.issues];
    issues[index] = value;
    setEdited({ ...edited, issues });
  };

  const removeIssue = (index: number) => {
    const issues = edited.issues.filter((_, i) => i !== index);
    setEdited({ ...edited, issues });
  };

  const addMaterial = (type: 'used' | 'required') => {
    const key = type === 'used' ? 'materialsUsed' : 'materialsRequired';
    setEdited({ ...edited, [key]: [...edited[key], { item: '', qty: '', notes: '' }] });
  };

  const updateMaterial = (type: 'used' | 'required', index: number, field: keyof MaterialItem, value: string) => {
    const key = type === 'used' ? 'materialsUsed' : 'materialsRequired';
    const materials = [...edited[key]];
    materials[index] = { ...materials[index], [field]: value };
    setEdited({ ...edited, [key]: materials });
  };

  const removeMaterial = (type: 'used' | 'required', index: number) => {
    const key = type === 'used' ? 'materialsUsed' : 'materialsRequired';
    const materials = edited[key].filter((_, i) => i !== index);
    setEdited({ ...edited, [key]: materials });
  };

  if (!isEditing && !canEdit) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-semibold mb-3">{section.name}</h3>
        {section.tasks.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Tasks Completed</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {section.tasks.map((task, i) => (
                <li key={i}>• {task}</li>
              ))}
            </ul>
          </div>
        )}
        {section.issues.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Issues</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {section.issues.map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
        {section.notes && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
            <p className="text-sm text-gray-600">{section.notes}</p>
          </div>
        )}
        {(section.materialsUsed.length > 0 || section.materialsRequired.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {section.materialsUsed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Materials Used</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {section.materialsUsed.map((m, i) => (
                    <li key={i}>• {m.item}{m.qty ? ` (${m.qty})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            {section.materialsRequired.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Materials Required</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {section.materialsRequired.map((m, i) => (
                    <li key={i}>• {m.item}{m.qty ? ` (${m.qty})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        {isEditing ? (
          <Input
            value={edited.name}
            onChange={(e) => setEdited({ ...edited, name: e.target.value })}
            className="flex-1 mr-2"
          />
        ) : (
          <h3 className="font-semibold">{section.name}</h3>
        )}
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} size="sm">
                  Save
                </Button>
                <Button onClick={() => { setIsEditing(false); setEdited(section); }} size="sm" variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button onClick={onRemove} size="sm" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Tasks Completed</h4>
              <Button onClick={addTask} size="sm" variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="space-y-2">
              {edited.tasks.map((task, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={task}
                    onChange={(e) => updateTask(i, e.target.value)}
                    placeholder="Task description"
                    className="text-sm flex-1"
                  />
                  <Button onClick={() => removeTask(i)} size="sm" variant="outline">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Issues</h4>
              <Button onClick={addIssue} size="sm" variant="outline">
                <Plus className="w-3 h-3 mr-1" />
                Add Issue
              </Button>
            </div>
            <div className="space-y-2">
              {edited.issues.map((issue, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={issue}
                    onChange={(e) => updateIssue(i, e.target.value)}
                    placeholder="Issue description"
                    className="text-sm flex-1"
                  />
                  <Button onClick={() => removeIssue(i)} size="sm" variant="outline">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h4 className="text-sm font-medium mb-2">Notes</h4>
            <Textarea
              value={edited.notes}
              onChange={(e) => setEdited({ ...edited, notes: e.target.value })}
              placeholder="Section notes..."
              rows={3}
            />
          </div>

          {/* Materials */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Materials Used</h4>
                <Button onClick={() => addMaterial('used')} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {edited.materialsUsed.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        value={m.item}
                        onChange={(e) => updateMaterial('used', i, 'item', e.target.value)}
                        placeholder="Item"
                        className="text-sm flex-1"
                      />
                      <Button onClick={() => removeMaterial('used', i)} size="sm" variant="outline">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={m.qty || ''}
                      onChange={(e) => updateMaterial('used', i, 'qty', e.target.value)}
                      placeholder="Quantity"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Materials Required</h4>
                <Button onClick={() => addMaterial('required')} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {edited.materialsRequired.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        value={m.item}
                        onChange={(e) => updateMaterial('required', i, 'item', e.target.value)}
                        placeholder="Item"
                        className="text-sm flex-1"
                      />
                      <Button onClick={() => removeMaterial('required', i)} size="sm" variant="outline">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      value={m.qty || ''}
                      onChange={(e) => updateMaterial('required', i, 'qty', e.target.value)}
                      placeholder="Quantity"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {section.tasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Tasks Completed</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {section.tasks.map((task, i) => (
                  <li key={i}>• {task}</li>
                ))}
              </ul>
            </div>
          )}
          {section.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Issues</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {section.issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
          {section.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{section.notes}</p>
            </div>
          )}
          {(section.materialsUsed.length > 0 || section.materialsRequired.length > 0) && (
            <div className="grid grid-cols-2 gap-4">
              {section.materialsUsed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Materials Used</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {section.materialsUsed.map((m, i) => (
                      <li key={i}>• {m.item}{m.qty ? ` (${m.qty})` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {section.materialsRequired.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Materials Required</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {section.materialsRequired.map((m, i) => (
                      <li key={i}>• {m.item}{m.qty ? ` (${m.qty})` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
