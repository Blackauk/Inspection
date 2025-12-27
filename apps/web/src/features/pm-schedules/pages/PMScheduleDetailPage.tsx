import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Tabs } from '../../../components/common/Tabs';
import { Table, TableHeader, TableRow, TableHeaderCell, TableCell } from '../../../components/common/Table';
import { FileUpload, type UploadedFile } from '../../../components/common/FileUpload';
import { Modal } from '../../../components/common/Modal';
import { GeneratePMTaskModal } from '../components/GeneratePMTaskModal';
import {
  getPMScheduleById,
  getPMScheduleHistory,
  getPMScheduleDocuments,
  getPMScheduleActivity,
  updatePMSchedule,
} from '../services';
import { showToast } from '../../../components/common/Toast';
import { GripVertical, Plus, X, Download, Upload, FileText, Image, File } from 'lucide-react';
import type { ComplianceRAG } from '../../assets/types';
import type { PMChecklistItem, PMScheduleDocument } from '../types';

export function PMScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const pmSchedule = id ? getPMScheduleById(id) : undefined;
  const history = pmSchedule ? getPMScheduleHistory(pmSchedule.id) : [];
  const documents = pmSchedule ? getPMScheduleDocuments(pmSchedule.id) : [];
  const activity = pmSchedule ? getPMScheduleActivity(pmSchedule.id) : [];

  const [isGenerateTaskOpen, setIsGenerateTaskOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<PMChecklistItem[]>(pmSchedule?.checklistItems || []);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [documentSearch, setDocumentSearch] = useState('');
  const [newNextDueDate, setNewNextDueDate] = useState('');
  const [currentHours, setCurrentHours] = useState('');
  const [nextDueHours, setNextDueHours] = useState('');

  useEffect(() => {
    if (pmSchedule?.checklistItems) {
      setChecklistItems(pmSchedule.checklistItems);
    }
  }, [pmSchedule]);

  if (!pmSchedule) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">
            PM Schedule not found
          </div>
        </Card>
      </div>
    );
  }

  const getRAGBadge = (rag: ComplianceRAG) => {
    const variants = {
      Red: 'error' as const,
      Amber: 'warning' as const,
      Green: 'success' as const,
    };
    return <Badge variant={variants[rag]}>{rag}</Badge>;
  };

  const getFrequencyDisplay = () => {
    if (pmSchedule.scheduleType === 'TimeBased' && pmSchedule.intervalDays) {
      if (pmSchedule.intervalDays === 7) return 'Weekly';
      if (pmSchedule.intervalDays === 30) return 'Monthly';
      if (pmSchedule.intervalDays === 90) return 'Quarterly';
      if (pmSchedule.intervalDays === 180) return '6-Monthly';
      if (pmSchedule.intervalDays === 365) return 'Annual';
      return `Every ${pmSchedule.intervalDays} days`;
    }
    if (pmSchedule.scheduleType === 'HoursBased' && pmSchedule.intervalHours) {
      return `Every ${pmSchedule.intervalHours} hours`;
    }
    return pmSchedule.scheduleType;
  };

  const canReschedule = ['Supervisor', 'Manager', 'Admin'].includes(user?.role || '');

  const handleMarkCompleted = () => {
    if (!pmSchedule) return;
    
    const updated = {
      ...pmSchedule,
      lastDoneDate: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
      nextDueDate: calculateNextDueDate(pmSchedule),
    };
    
    updatePMSchedule(pmSchedule.id, updated);
    
    // Add history entry
    const history = JSON.parse(localStorage.getItem('pm-schedule-history') || '[]');
    history.push({
      id: `hist-${Date.now()}`,
      scheduleId: pmSchedule.id,
      completedDate: new Date().toISOString(),
      completedBy: user?.id || '',
      completedByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      notes: 'Marked as completed',
      result: 'Completed' as const,
    });
    localStorage.setItem('pm-schedule-history', JSON.stringify(history));
    
    // Add activity log entry
    const activity = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
    activity.push({
      id: `act-${Date.now()}`,
      scheduleId: pmSchedule.id,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      action: 'marked_completed',
      details: 'PM Schedule marked as completed',
    });
    localStorage.setItem('pm-schedule-activity', JSON.stringify(activity));
    
    showToast('PM Schedule marked as completed', 'success');
    window.location.reload(); // Refresh to show updated data
  };

  const calculateNextDueDate = (sched: typeof pmSchedule): string => {
    const today = new Date();
    if (sched.scheduleType === 'TimeBased' && sched.intervalDays) {
      const next = new Date(today);
      next.setDate(next.getDate() + sched.intervalDays);
      return next.toISOString().split('T')[0];
    } else if (sched.scheduleType === 'HoursBased' && sched.intervalHours) {
      const next = new Date(today);
      next.setDate(next.getDate() + 30);
      return next.toISOString().split('T')[0];
    }
    return today.toISOString().split('T')[0];
  };

  const handleReschedule = () => {
    if (!pmSchedule) return;
    
    if (pmSchedule.scheduleType === 'TimeBased' && !newNextDueDate) {
      showToast('Please enter a new due date', 'error');
      return;
    }
    
    if (pmSchedule.scheduleType === 'HoursBased' && (!currentHours || !nextDueHours)) {
      showToast('Please enter current hours and next due hours', 'error');
      return;
    }
    
    const updated: Partial<typeof pmSchedule> = {};
    
    if (pmSchedule.scheduleType === 'TimeBased') {
      updated.nextDueDate = newNextDueDate;
    } else if (pmSchedule.scheduleType === 'HoursBased') {
      const hoursDiff = Number(nextDueHours) - Number(currentHours);
      const estimatedDays = Math.ceil(hoursDiff / 8); // Assume 8 hours per day
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + estimatedDays);
      updated.nextDueDate = nextDate.toISOString().split('T')[0];
    }
    
    updatePMSchedule(pmSchedule.id, updated);
    
    // Add activity log entry
    const activity = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
    activity.push({
      id: `act-${Date.now()}`,
      scheduleId: pmSchedule.id,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      action: 'rescheduled',
      details: `Next due date changed to ${updated.nextDueDate}`,
    });
    localStorage.setItem('pm-schedule-activity', JSON.stringify(activity));
    
    showToast('PM Schedule rescheduled successfully', 'success');
    setIsRescheduleOpen(false);
    setNewNextDueDate('');
    setCurrentHours('');
    setNextDueHours('');
    window.location.reload();
  };

  const handleAddChecklistItem = () => {
    const newItem: PMChecklistItem = {
      id: `check-${Date.now()}`,
      order: checklistItems.length + 1,
      checkItem: 'New checklist item',
      checkType: 'PassFailNA',
      required: true,
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  const handleUpdateChecklistItem = (id: string, updates: Partial<PMChecklistItem>) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklistItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.map((item, index) => ({ ...item, order: index + 1 }));
    });
  };

  const handleDuplicateChecklistItem = (id: string) => {
    const item = checklistItems.find((i) => i.id === id);
    if (item) {
      const newItem: PMChecklistItem = {
        ...item,
        id: `check-${Date.now()}`,
        order: checklistItems.length + 1,
        checkItem: `${item.checkItem} (Copy)`,
      };
      setChecklistItems([...checklistItems, newItem]);
    }
  };

  const handleMoveItem = (id: string, direction: 'up' | 'down') => {
    setChecklistItems((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      
      const newItems = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      return newItems.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const handleSaveChecklist = () => {
    if (!pmSchedule) return;
    
    const updated = {
      ...pmSchedule,
      checklistItems,
    };
    
    updatePMSchedule(pmSchedule.id, updated);
    
    // Add activity log entry
    const activity = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
    activity.push({
      id: `act-${Date.now()}`,
      scheduleId: pmSchedule.id,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      action: 'checklist_edited',
      details: `Updated ${checklistItems.length} checklist items`,
    });
    localStorage.setItem('pm-schedule-activity', JSON.stringify(activity));
    
    showToast('Checklist saved successfully', 'success');
  };

  const handlePasteFromExcel = () => {
    if (!pasteData.trim()) {
      showToast('Please paste data first', 'error');
      return;
    }
    
    const lines = pasteData.split('\n').filter((line) => line.trim());
    const newItems: PMChecklistItem[] = [];
    
    lines.forEach((line, index) => {
      const columns = line.split('\t');
      if (columns.length === 0) return;
      
      const item: PMChecklistItem = {
        id: `check-${Date.now()}-${index}`,
        order: checklistItems.length + index + 1,
        checkItem: columns[0] || `Item ${index + 1}`,
        checkType: (columns[1] as PMChecklistItem['checkType']) || 'PassFailNA',
        required: columns[2]?.toLowerCase() === 'true' || columns[2]?.toLowerCase() === 'yes' || columns[2]?.toLowerCase() === 'required',
        expectedValue: columns[3] ? (isNaN(Number(columns[3])) ? columns[3] : Number(columns[3])) : undefined,
        units: columns[4] || undefined,
        notesGuidance: columns[5] || undefined,
      };
      newItems.push(item);
    });
    
    setChecklistItems([...checklistItems, ...newItems]);
    setPasteData('');
    setIsPasteModalOpen(false);
    showToast(`Added ${newItems.length} checklist items`, 'success');
  };

  const handleDownloadTemplate = () => {
    const headers = ['Check Item', 'Check Type', 'Required', 'Expected Value', 'Units', 'Notes Guidance'];
    const exampleRows = [
      ['Check hydraulic fluid level', 'PassFailNA', 'Yes', '', '', 'Check sight glass'],
      ['Engine oil level', 'PassFailNA', 'Yes', '', '', 'Check dipstick'],
      ['Hydraulic pressure', 'Numeric', 'Yes', '3000', 'psi', 'Check pressure gauge'],
    ];
    
    const csv = [
      headers.join('\t'),
      ...exampleRows.map((row) => row.join('\t')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pm-checklist-template.tsv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadChecklist = (files: UploadedFile[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0]?.split('\t') || [];
      
      const newItems: PMChecklistItem[] = [];
      lines.slice(1).forEach((line, index) => {
        const columns = line.split('\t');
        const item: PMChecklistItem = {
          id: `check-${Date.now()}-${index}`,
          order: checklistItems.length + index + 1,
          checkItem: columns[0] || `Item ${index + 1}`,
          checkType: (columns[1] as PMChecklistItem['checkType']) || 'PassFailNA',
          required: columns[2]?.toLowerCase() === 'true' || columns[2]?.toLowerCase() === 'yes',
          expectedValue: columns[3] ? (isNaN(Number(columns[3])) ? columns[3] : Number(columns[3])) : undefined,
          units: columns[4] || undefined,
          notesGuidance: columns[5] || undefined,
        };
        newItems.push(item);
      });
      
      setChecklistItems([...checklistItems, ...newItems]);
      showToast(`Imported ${newItems.length} checklist items`, 'success');
    };
    
    reader.readAsText(file.file);
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(documentSearch.toLowerCase()) ||
    doc.type.toLowerCase().includes(documentSearch.toLowerCase())
  );

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
            {/* Left Card: Schedule Summary */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Summary</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">PM Schedule Name</label>
                    <div className="font-medium text-gray-900">{pmSchedule.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Asset</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="info">{pmSchedule.assetTypeCode}</Badge>
                      <button
                        onClick={() => navigate(`/assets/${pmSchedule.assetId}`)}
                        className="font-mono text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {pmSchedule.assetId}
                      </button>
                      <span className="text-gray-900">{pmSchedule.assetMake} {pmSchedule.assetModel}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Site</label>
                    <div className="text-gray-900">{pmSchedule.siteName}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Schedule Type</label>
                    <div className="text-gray-900">
                      {pmSchedule.scheduleType === 'TimeBased' ? 'Time-based' : 'Usage-based'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Frequency</label>
                    <div className="text-gray-900">{getFrequencyDisplay()}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Assigned Team</label>
                    <div className="text-gray-900">{pmSchedule.assignedTeam || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Card: Operational Status */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Done</label>
                    <div className="text-gray-900">
                      {pmSchedule.lastDoneDate ? new Date(pmSchedule.lastDoneDate).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Next Due</label>
                    <div className="font-medium text-gray-900">
                      {new Date(pmSchedule.nextDueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">RAG Status</label>
                    <div>{getRAGBadge(pmSchedule.ragStatus)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <div>
                      <Badge variant={pmSchedule.isActive ? 'success' : 'default'}>
                        {pmSchedule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'checklist',
      label: 'Checklist',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">PM Checklist Template</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-1" />
                  Download Template
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsPasteModalOpen(true)}>
                  Paste from Excel
                </Button>
                <div>
                  <input
                    type="file"
                    accept=".tsv,.csv,.xlsx"
                    className="hidden"
                    id="checklist-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          const lines = text.split('\n').filter((line) => line.trim());
                          const headers = lines[0]?.split('\t') || [];
                          
                          const newItems: PMChecklistItem[] = [];
                          lines.slice(1).forEach((line, index) => {
                            const columns = line.split('\t');
                            const item: PMChecklistItem = {
                              id: `check-${Date.now()}-${index}`,
                              order: checklistItems.length + index + 1,
                              checkItem: columns[0] || `Item ${index + 1}`,
                              checkType: (columns[1] as PMChecklistItem['checkType']) || 'PassFailNA',
                              required: columns[2]?.toLowerCase() === 'true' || columns[2]?.toLowerCase() === 'yes',
                              expectedValue: columns[3] ? (isNaN(Number(columns[3])) ? columns[3] : Number(columns[3])) : undefined,
                              units: columns[4] || undefined,
                              notesGuidance: columns[5] || undefined,
                            };
                            newItems.push(item);
                          });
                          
                          setChecklistItems([...checklistItems, ...newItems]);
                          showToast(`Imported ${newItems.length} checklist items`, 'success');
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => document.getElementById('checklist-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload File
                  </Button>
                </div>
                <Button size="sm" variant="primary" onClick={handleAddChecklistItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
                <Button size="sm" variant="primary" onClick={handleSaveChecklist}>
                  Save Checklist
                </Button>
              </div>
            </div>

            {checklistItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No checklist items. Click "Add Item" to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell className="w-8"></TableHeaderCell>
                    <TableHeaderCell className="w-12">Order</TableHeaderCell>
                    <TableHeaderCell>Check Item</TableHeaderCell>
                    <TableHeaderCell>Check Type</TableHeaderCell>
                    <TableHeaderCell className="w-20">Required</TableHeaderCell>
                    <TableHeaderCell>Expected/Target</TableHeaderCell>
                    <TableHeaderCell>Units</TableHeaderCell>
                    <TableHeaderCell>Notes Guidance</TableHeaderCell>
                    <TableHeaderCell className="w-32">Actions</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {checklistItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell>
                        <Input
                          value={item.checkItem}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { checkItem: e.target.value })}
                          className="w-full"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.checkType}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { checkType: e.target.value as PMChecklistItem['checkType'] })}
                          options={[
                            { value: 'PassFailNA', label: 'Pass/Fail/N/A' },
                            { value: 'YesNoNA', label: 'Yes/No/N/A' },
                            { value: 'Numeric', label: 'Numeric' },
                            { value: 'Hours', label: 'Hours' },
                            { value: 'DateTime', label: 'Date/Time' },
                            { value: 'FreeText', label: 'Free Text' },
                          ]}
                          className="w-40"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { required: e.target.checked })}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.expectedValue?.toString() || ''}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { expectedValue: e.target.value })}
                          className="w-32"
                          size="sm"
                          placeholder="Optional"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.units || ''}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { units: e.target.value })}
                          className="w-24"
                          size="sm"
                          placeholder="e.g., psi"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.notesGuidance || ''}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { notesGuidance: e.target.value })}
                          className="w-full"
                          size="sm"
                          placeholder="Helper text"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveItem(item.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoveItem(item.id, 'down')}
                            disabled={index === checklistItems.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDuplicateChecklistItem(item.id)}
                          >
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'history',
      label: 'History',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion History</h3>
            {history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Date Completed</TableHeaderCell>
                    <TableHeaderCell>Completed By</TableHeaderCell>
                    <TableHeaderCell>Result</TableHeaderCell>
                    <TableHeaderCell>Work Order</TableHeaderCell>
                    <TableHeaderCell>Notes Summary</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {history.map((entry) => (
                    <TableRow 
                      key={entry.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        // Open PM Task details - for now show a toast, could open modal
                        showToast(`Viewing PM Task completion from ${new Date(entry.completedDate).toLocaleDateString()}`, 'info');
                      }}
                    >
                      <TableCell>
                        {new Date(entry.completedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{entry.completedByName}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            entry.result === 'Completed' ? 'success' :
                            entry.result === 'Failed' ? 'error' :
                            'warning'
                          }
                        >
                          {entry.result || 'Completed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.workOrderId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/work-orders/${entry.workOrderId}`);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:underline font-mono text-sm"
                          >
                            {entry.workOrderId}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700 line-clamp-2">
                          {entry.notes || 'N/A'}
                        </div>
                        {/* Show issue summary if available */}
                        {entry.result === 'Issues found' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Issues found • Defects/Work Orders created
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">No completion history</div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      content: (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search documents..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="w-64"
                  size="sm"
                />
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
                    multiple
                    className="hidden"
                    id="document-upload"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        showToast(`Uploaded ${files.length} document(s)`, 'success');
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => document.getElementById('document-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload Document
                  </Button>
                </div>
              </div>
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {doc.type === 'Photo' ? (
                        <Image className="w-5 h-5 text-blue-600" />
                      ) : doc.type === 'Manual' || doc.type === 'Procedure' ? (
                        <FileText className="w-5 h-5 text-green-600" />
                      ) : (
                        <File className="w-5 h-5 text-gray-600" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{doc.filename}</div>
                        <div className="text-sm text-gray-500">
                          {doc.type} • Uploaded by {doc.uploadedByName} on {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {doc.tags.map((tag) => (
                              <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="info">{doc.type}</Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {documentSearch ? 'No documents match your search' : 'No documents uploaded'}
              </div>
            )}
          </div>
        </Card>
      ),
    },
    {
      id: 'activity',
      label: 'Activity Log',
      content: (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
            {activity.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell>Date & Time</TableHeaderCell>
                      <TableHeaderCell>User</TableHeaderCell>
                      <TableHeaderCell>Action</TableHeaderCell>
                      <TableHeaderCell>Details</TableHeaderCell>
                      <TableHeaderCell>Reference</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {activity.map((entry) => {
                      const getActionBadge = (action: string) => {
                        const actionLabels: Record<string, string> = {
                          schedule_created: 'Generated',
                          checklist_edited: 'Checklist Edited',
                          pm_task_generated: 'Generated',
                          marked_completed: 'Completed',
                          rescheduled: 'Rescheduled',
                          document_uploaded: 'Document Uploaded',
                          status_changed: 'Status Changed',
                          assigned_team_changed: 'Team Changed',
                        };
                        const label = actionLabels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                        
                        const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
                          schedule_created: 'info',
                          pm_task_generated: 'info',
                          marked_completed: 'success',
                          rescheduled: 'warning',
                          document_uploaded: 'info',
                          checklist_edited: 'default',
                          status_changed: 'default',
                          assigned_team_changed: 'default',
                        };
                        return (
                          <Badge variant={variants[action] || 'default'} size="sm">
                            {label}
                          </Badge>
                        );
                      };

                      // Extract reference from details (e.g., PM Task ID, document name)
                      const extractReference = (details?: string) => {
                        if (!details) return null;
                        // Look for PM Task ID pattern (PMT-XXXXXX)
                        const pmTaskMatch = details.match(/PMT-\d+/);
                        if (pmTaskMatch) {
                          return {
                            type: 'pm_task',
                            value: pmTaskMatch[0],
                            label: pmTaskMatch[0],
                          };
                        }
                        // Look for document name pattern (Uploaded: filename.ext)
                        const docMatch = details.match(/Uploaded:\s*(.+)/);
                        if (docMatch) {
                          return {
                            type: 'document',
                            value: docMatch[1],
                            label: docMatch[1],
                          };
                        }
                        return null;
                      };

                      const reference = extractReference(entry.details);

                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {new Date(entry.timestamp).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">{entry.userName}</div>
                          </TableCell>
                          <TableCell>{getActionBadge(entry.action)}</TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700 max-w-md">
                              {entry.details || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {reference ? (
                              <button
                                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-mono"
                                onClick={() => {
                                  if (reference.type === 'pm_task') {
                                    // Navigate to PM Task or show toast
                                    showToast(`Viewing ${reference.value}`, 'info');
                                  } else {
                                    // Show document preview or navigate
                                    showToast(`Viewing document: ${reference.label}`, 'info');
                                  }
                                }}
                              >
                                {reference.label}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No activity recorded for this PM schedule yet</div>
            )}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{pmSchedule.name}</h1>
                {getRAGBadge(pmSchedule.ragStatus)}
              </div>
              <div className="text-lg text-gray-700 mb-1">
                Asset:{' '}
                <button
                  onClick={() => navigate(`/assets/${pmSchedule.assetId}`)}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  <Badge variant="info" size="sm">{pmSchedule.assetTypeCode}</Badge> {pmSchedule.assetId}
                </button>
                {' • '}
                {pmSchedule.assetMake} {pmSchedule.assetModel}
              </div>
              <div className="text-sm text-gray-600">
                {pmSchedule.siteName} • Next due: {new Date(pmSchedule.nextDueDate).toLocaleDateString()}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsEditScheduleOpen(true)}>
              Edit Schedule
            </Button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => setIsGenerateTaskOpen(true)}>
              Start / Generate PM Task
            </Button>
            <Button size="sm" variant="primary" onClick={handleMarkCompleted}>
              Mark Completed
            </Button>
            {canReschedule && (
              <Button size="sm" variant="outline" onClick={() => setIsRescheduleOpen(true)}>
                Reschedule
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-6">
        <Tabs tabs={tabs} defaultTab="overview" />
      </div>

      {/* Modals */}
      <GeneratePMTaskModal
        isOpen={isGenerateTaskOpen}
        onClose={() => setIsGenerateTaskOpen(false)}
        schedule={pmSchedule}
        onTaskCreated={(task) => {
          showToast('PM Task created successfully', 'success');
          window.location.reload();
        }}
      />

      {/* Paste from Excel Modal */}
      <Modal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        title="Paste from Excel"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Paste tab-separated values from Excel. Columns: Check Item | Check Type | Required | Expected Value | Units | Notes Guidance
          </p>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={10}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="Paste your data here..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPasteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasteFromExcel}>
              Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule PM"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Next Due Date</label>
            <div className="text-gray-900">{new Date(pmSchedule.nextDueDate).toLocaleDateString()}</div>
          </div>
          <div>
            <Input
              label="New Next Due Date *"
              type="date"
              value={newNextDueDate}
              onChange={(e) => setNewNextDueDate(e.target.value)}
            />
          </div>
          {pmSchedule.scheduleType === 'HoursBased' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current Hours *"
                type="number"
                value={currentHours}
                onChange={(e) => setCurrentHours(e.target.value)}
                placeholder="Enter current hours"
              />
              <Input
                label="Next Due At Hours *"
                type="number"
                value={nextDueHours}
                onChange={(e) => setNextDueHours(e.target.value)}
                placeholder="Enter target hours"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReschedule}>
              Reschedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
