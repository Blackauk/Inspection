import { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { FileUpload, type UploadedFile } from '../../../components/common/FileUpload';
import { useAuth } from '../../../contexts/AuthContext';
import { showToast } from '../../../components/common/Toast';
import { updatePMSchedule } from '../services';
import { Camera, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createDefect, getDefectById } from '../../defects/services';
import { createWorkOrderDraft, getWorkOrderById } from '../../work-orders/services';
import type { PMSchedule, PMChecklistItem, PMChecklistAnswer, PMTask, PMChecklistIssuePayload } from '../types';

interface GeneratePMTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: PMSchedule;
  onTaskCreated?: (task: PMTask) => void;
}

const mockUsers = [
  { id: 'user-1', name: 'John Smith' },
  { id: 'user-2', name: 'Sarah Johnson' },
  { id: 'user-3', name: 'Mike Davis' },
  { id: 'user-4', name: 'Emma Wilson' },
  { id: 'user-5', name: 'Tom Brown' },
  { id: 'user-6', name: 'Lisa Anderson' },
  { id: 'user-7', name: 'David Lee' },
];

export function GeneratePMTaskModal({ isOpen, onClose, schedule, onTaskCreated }: GeneratePMTaskModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState(`PM Task: ${schedule.name}`);
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, PMChecklistAnswer>>({});
  const [itemPhotos, setItemPhotos] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [createdDefectIds, setCreatedDefectIds] = useState<Record<string, string>>({});
  const [createdWorkOrderIds, setCreatedWorkOrderIds] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTitle(`PM Task: ${schedule.name}`);
      setAssignedToId('');
      setPriority('Medium');
      setStartDate('');
      setNotes('');
      setAttachments([]);
      setChecklistAnswers({});
      setItemPhotos({});
      setErrors({});
      setIsCompleting(false);
    }
  }, [isOpen, schedule]);

  const handleChecklistChange = (itemId: string, value: any, field: string) => {
    setChecklistAnswers((prev) => {
      const existing = prev[itemId] || { id: `answer-${itemId}`, checklistItemId: itemId };
      const updated = {
        ...existing,
        [field]: value,
      };
      
      // Auto-enable Issue Found if result is Fail
      if (field === 'result' && (value === 'Fail' || value === 'No')) {
        if (!updated.issueFound) {
          updated.issueFound = true;
          const item = schedule.checklistItems?.find((i) => i.id === itemId);
          updated.issuePayload = {
            title: `Issue found: ${item?.checkItem || 'Checklist item'}`,
            description: `${item?.checkItem || ''}\nResult: ${value}\n${existing.notes || ''}`.trim(),
            severity: 'Medium',
            unsafeDoNotUse: false,
            createDefect: true,
            createWorkOrder: value === 'Fail' || updated.issuePayload?.unsafeDoNotUse || false,
            assignedToId: existing.issuePayload?.assignedToId,
            targetDate: existing.issuePayload?.targetDate,
          };
        }
      }
      
      return {
        ...prev,
        [itemId]: updated,
      };
    });
  };
  
  const handleIssueFoundToggle = (itemId: string, enabled: boolean) => {
    setChecklistAnswers((prev) => {
      const existing = prev[itemId] || { id: `answer-${itemId}`, checklistItemId: itemId };
      const item = schedule.checklistItems?.find((i) => i.id === itemId);
      const result = existing.result;
      
      return {
        ...prev,
        [itemId]: {
          ...existing,
          issueFound: enabled,
          issuePayload: enabled ? (existing.issuePayload || {
            title: `Issue found: ${item?.checkItem || 'Checklist item'}`,
            description: `${item?.checkItem || ''}\nResult: ${result || 'N/A'}\n${existing.notes || ''}`.trim(),
            severity: 'Medium',
            unsafeDoNotUse: false,
            createDefect: true,
            createWorkOrder: result === 'Fail' || result === 'No' || false,
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          }) : undefined,
        },
      };
    });
  };
  
  const handleIssuePayloadChange = (itemId: string, updates: Partial<PMChecklistIssuePayload>) => {
    setChecklistAnswers((prev) => {
      const existing = prev[itemId] || { id: `answer-${itemId}`, checklistItemId: itemId };
      return {
        ...prev,
        [itemId]: {
          ...existing,
          issuePayload: {
            ...(existing.issuePayload || {} as PMChecklistIssuePayload),
            ...updates,
          } as PMChecklistIssuePayload,
        },
      };
    });
  };

  const handlePhotoUpload = (itemId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setItemPhotos((prev) => ({ ...prev, [itemId]: dataUrl }));
      handleChecklistChange(itemId, dataUrl, 'photoUri');
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    // Validate required checklist items
    schedule.checklistItems?.forEach((item) => {
      if (item.required) {
        const answer = checklistAnswers[item.id];
        if (!answer) {
          newErrors[`item-${item.id}`] = 'This item is required';
        } else {
          if (item.checkType === 'PassFailNA' && !answer.result) {
            newErrors[`item-${item.id}`] = 'Please select Pass, Fail, or N/A';
          } else if (item.checkType === 'YesNoNA' && !answer.result) {
            newErrors[`item-${item.id}`] = 'Please select Yes, No, or N/A';
          } else if (item.checkType === 'Numeric' && answer.numericValue === undefined) {
            newErrors[`item-${item.id}`] = 'Numeric value is required';
          } else if (item.checkType === 'Hours' && answer.hoursValue === undefined) {
            newErrors[`item-${item.id}`] = 'Hours value is required';
          } else if (item.checkType === 'DateTime' && !answer.dateTimeValue) {
            newErrors[`item-${item.id}`] = 'Date/Time is required';
          } else if (item.checkType === 'FreeText' && !answer.textValue) {
            newErrors[`item-${item.id}`] = 'Text is required';
          }
        }
      }
      
      // Validate Issue Found if enabled
      if (answer?.issueFound) {
        if (!answer.issuePayload?.title?.trim()) {
          newErrors[`issue-title-${item.id}`] = 'Issue title is required';
        }
        if (!answer.issuePayload?.description?.trim()) {
          newErrors[`issue-desc-${item.id}`] = 'Issue description is required';
        }
        if (answer.issuePayload?.unsafeDoNotUse && 
            !answer.issuePayload?.createDefect && 
            !answer.issuePayload?.createWorkOrder) {
          newErrors[`issue-action-${item.id}`] = 'Unsafe issues must create Defect or Work Order';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const createDraftsFromIssues = (taskId: string): { defectCount: number; workOrderCount: number } => {
    let defectCount = 0;
    let workOrderCount = 0;
    
    Object.values(checklistAnswers).forEach((answer) => {
      if (!answer.issueFound || !answer.issuePayload) return;
      
      const payload = answer.issuePayload;
      const item = schedule.checklistItems?.find((i) => i.id === answer.checklistItemId);
      
      // Check if draft already exists
      const existingDefectId = createdDefectIds[answer.checklistItemId];
      const existingWorkOrderId = createdWorkOrderIds[answer.checklistItemId];
      
      // Create Defect draft
      if (payload.createDefect && !existingDefectId) {
        try {
          const defect = createDefect({
            title: payload.title,
            description: payload.description,
            severity: payload.severity,
            severityModel: 'LMH',
            unsafeDoNotUse: payload.unsafeDoNotUse,
            assetId: schedule.assetId,
            siteId: schedule.siteId,
            assignedToId: payload.assignedToId,
            targetRectificationDate: payload.targetDate,
            status: 'Draft',
            pmScheduleId: schedule.id,
            pmTaskId: taskId,
            pmChecklistItemId: answer.checklistItemId,
            attachments: itemPhotos[answer.checklistItemId] ? [{
              filename: `check-photo-${answer.checklistItemId}.jpg`,
              uri: itemPhotos[answer.checklistItemId],
              type: 'photo' as const,
            }] : undefined,
            createdBy: user?.id || '',
            createdByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
          });
          
          setCreatedDefectIds((prev) => ({ ...prev, [answer.checklistItemId]: defect.id }));
          answer.generatedDefectId = defect.id;
          defectCount++;
        } catch (error) {
          console.error('Failed to create defect:', error);
        }
      } else if (existingDefectId) {
        // Update existing defect
        const existing = getDefectById(existingDefectId);
        if (existing) {
          existing.title = payload.title;
          existing.description = payload.description;
          existing.severity = payload.severity;
          existing.unsafeDoNotUse = payload.unsafeDoNotUse;
          if (payload.assignedToId) existing.assignedToId = payload.assignedToId;
          if (payload.targetDate) existing.targetRectificationDate = payload.targetDate;
        }
      }
      
      // Create Work Order draft
      if (payload.createWorkOrder && !existingWorkOrderId) {
        try {
          const workOrder = createWorkOrderDraft({
            title: payload.title,
            description: payload.description,
            assetId: schedule.assetId,
            siteId: schedule.siteId,
            type: 'Corrective',
            status: 'Open',
            priority: payload.unsafeDoNotUse ? 'Critical' : 
                     (payload.severity === 'High' || payload.severity === 'Critical') ? 'High' : 'Medium',
            assignedToId: payload.assignedToId,
            dueDate: payload.targetDate || schedule.nextDueDate,
            createdById: user?.id || '',
            createdByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
            isDraft: true,
            pmScheduleId: schedule.id,
            pmTaskId: taskId,
            pmChecklistItemId: answer.checklistItemId,
          });
          
          setCreatedWorkOrderIds((prev) => ({ ...prev, [answer.checklistItemId]: workOrder.id }));
          answer.generatedWorkOrderId = workOrder.id;
          workOrderCount++;
        } catch (error) {
          console.error('Failed to create work order:', error);
        }
      } else if (existingWorkOrderId) {
        // Update existing work order
        const existing = getWorkOrderById(existingWorkOrderId);
        if (existing) {
          existing.title = payload.title;
          existing.description = payload.description;
          existing.priority = payload.unsafeDoNotUse ? 'Critical' : 
                            (payload.severity === 'High' || payload.severity === 'Critical') ? 'High' : 'Medium';
          if (payload.assignedToId) existing.assignedToId = payload.assignedToId;
          if (payload.targetDate) existing.dueDate = payload.targetDate;
        }
      }
    });
    
    return { defectCount, workOrderCount };
  };

  const handleSaveDraft = () => {
    if (!validate()) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    const task: PMTask = {
      id: `pmt-${Date.now()}`,
      taskCode: `PMT-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      assetId: schedule.assetId,
      assetTypeCode: schedule.assetTypeCode,
      assetMake: schedule.assetMake,
      assetModel: schedule.assetModel,
      siteId: schedule.siteId,
      siteName: schedule.siteName,
      title,
      description: notes,
      taskType: 'PM',
      priority,
      status: 'Draft',
      assignedToId: assignedToId || undefined,
      assignedToName: assignedToId ? mockUsers.find((u) => u.id === assignedToId)?.name : undefined,
      assignedTeam: schedule.assignedTeam,
      dueDate: schedule.nextDueDate,
      startDate: startDate || undefined,
      checklistItems: schedule.checklistItems || [],
      checklistAnswers: Object.values(checklistAnswers),
      attachments: attachments.map((file) => ({
        id: `att-${Date.now()}-${Math.random()}`,
        type: file.type === 'photo' ? 'photo' : 'document',
        filename: file.file.name,
        uri: file.preview || file.file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.id || '',
      })),
      notes,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || '',
      createdByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
    };
    
    // Create drafts from issues
    const { defectCount, workOrderCount } = createDraftsFromIssues(task.id);
    
    // Update checklist answers with generated IDs
    Object.keys(checklistAnswers).forEach((itemId) => {
      const answer = checklistAnswers[itemId];
      if (answer.issueFound && answer.issuePayload) {
        answer.generatedDefectId = createdDefectIds[itemId];
        answer.generatedWorkOrderId = createdWorkOrderIds[itemId];
      }
    });
    
    // Update task with updated answers
    task.checklistAnswers = Object.values(checklistAnswers);
    
    // Save to localStorage for now
    const existing = JSON.parse(localStorage.getItem('pm-tasks') || '[]');
    existing.push(task);
    localStorage.setItem('pm-tasks', JSON.stringify(existing));
    
    // Add activity log entry for task generation
    const activity = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
    activity.push({
      id: `act-${Date.now()}`,
      scheduleId: schedule.id,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      action: 'pm_task_generated',
      details: `Generated PM Task ${task.taskCode} (Draft)${defectCount > 0 || workOrderCount > 0 ? ` - ${defectCount} defect(s), ${workOrderCount} WO(s) created` : ''}`,
    });
    localStorage.setItem('pm-schedule-activity', JSON.stringify(activity));
    
    const toastMessage = defectCount > 0 || workOrderCount > 0
      ? `PM Task saved. ${defectCount} defect draft(s) and ${workOrderCount} work order draft(s) created.`
      : 'PM Task saved as draft';
    showToast(toastMessage, 'success');
    onTaskCreated?.(task);
    onClose();
  };

  const handleComplete = () => {
    if (!validate()) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    
    setIsCompleting(true);
    
    const task: PMTask = {
      id: `pmt-${Date.now()}`,
      taskCode: `PMT-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      assetId: schedule.assetId,
      assetTypeCode: schedule.assetTypeCode,
      assetMake: schedule.assetMake,
      assetModel: schedule.assetModel,
      siteId: schedule.siteId,
      siteName: schedule.siteName,
      title,
      description: notes,
      taskType: 'PM',
      priority,
      status: 'Completed',
      assignedToId: assignedToId || undefined,
      assignedToName: assignedToId ? mockUsers.find((u) => u.id === assignedToId)?.name : undefined,
      assignedTeam: schedule.assignedTeam,
      dueDate: schedule.nextDueDate,
      startDate: startDate || undefined,
      completedAt: new Date().toISOString(),
      completedBy: user?.id || '',
      completedByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      checklistItems: schedule.checklistItems || [],
      checklistAnswers: [],
      attachments: attachments.map((file) => ({
        id: `att-${Date.now()}-${Math.random()}`,
        type: file.type === 'photo' ? 'photo' : 'document',
        filename: file.file.name,
        uri: file.preview || file.file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.id || '',
      })),
      notes,
      createdAt: new Date().toISOString(),
      createdBy: user?.id || '',
      createdByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
    };
    
    // Create drafts from issues
    const { defectCount, workOrderCount } = createDraftsFromIssues(task.id);
    
    // Update checklist answers with generated IDs
    Object.keys(checklistAnswers).forEach((itemId) => {
      const answer = checklistAnswers[itemId];
      if (answer.issueFound && answer.issuePayload) {
        answer.generatedDefectId = createdDefectIds[itemId];
        answer.generatedWorkOrderId = createdWorkOrderIds[itemId];
      }
    });
    
    // Update task with updated answers
    task.checklistAnswers = Object.values(checklistAnswers);
    
    // Save task
    const existing = JSON.parse(localStorage.getItem('pm-tasks') || '[]');
    existing.push(task);
    localStorage.setItem('pm-tasks', JSON.stringify(existing));
    
    // Update schedule using service function
    updatePMSchedule(schedule.id, {
      lastDoneDate: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
      nextDueDate: calculateNextDueDate(schedule),
    });
    
    // Add history entry to localStorage (will be merged with mock data on next load)
    const history = JSON.parse(localStorage.getItem('pm-schedule-history') || '[]');
    history.push({
      id: `hist-${Date.now()}`,
      scheduleId: schedule.id,
      completedDate: new Date().toISOString(),
      completedBy: user?.id || '',
      completedByName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      notes: notes || 'PM Task completed',
      result: 'Completed' as const,
      workOrderId: undefined,
    });
    localStorage.setItem('pm-schedule-history', JSON.stringify(history));
    
    // Add activity log entry
    const activity = JSON.parse(localStorage.getItem('pm-schedule-activity') || '[]');
    activity.push({
      id: `act-${Date.now()}`,
      scheduleId: schedule.id,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      action: 'pm_task_generated' as const,
      details: `Generated PM Task ${task.taskCode}`,
    });
    activity.push({
      id: `act-${Date.now()}-2`,
      scheduleId: schedule.id,
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown') : 'Unknown',
      action: 'marked_completed' as const,
      details: `PM Task ${task.taskCode} completed`,
    });
    localStorage.setItem('pm-schedule-activity', JSON.stringify(activity));
    
    showToast('PM Task completed successfully', 'success');
    onTaskCreated?.(task);
    setIsCompleting(false);
    onClose();
  };

  const calculateNextDueDate = (sched: PMSchedule): string => {
    const today = new Date();
    if (sched.scheduleType === 'TimeBased' && sched.intervalDays) {
      const next = new Date(today);
      next.setDate(next.getDate() + sched.intervalDays);
      return next.toISOString().split('T')[0];
    } else if (sched.scheduleType === 'HoursBased' && sched.intervalHours) {
      // For hours-based, we'd need current hours - simplified for now
      const next = new Date(today);
      next.setDate(next.getDate() + 30); // Default to 30 days
      return next.toISOString().split('T')[0];
    }
    return today.toISOString().split('T')[0];
  };

  const renderChecklistInput = (item: PMChecklistItem) => {
    const answer = checklistAnswers[item.id];
    const error = errors[`item-${item.id}`];
    
    switch (item.checkType) {
      case 'PassFailNA':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={answer?.result === 'Pass' ? 'primary' : 'outline'}
                onClick={() => handleChecklistChange(item.id, 'Pass', 'result')}
              >
                Pass
              </Button>
              <Button
                type="button"
                size="sm"
                variant={answer?.result === 'Fail' ? 'error' : 'outline'}
                onClick={() => handleChecklistChange(item.id, 'Fail', 'result')}
              >
                Fail
              </Button>
              <Button
                type="button"
                size="sm"
                variant={answer?.result === 'NA' ? 'default' : 'outline'}
                onClick={() => handleChecklistChange(item.id, 'NA', 'result')}
              >
                N/A
              </Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      
      case 'YesNoNA':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={answer?.result === 'Yes' ? 'primary' : 'outline'}
                onClick={() => handleChecklistChange(item.id, 'Yes', 'result')}
              >
                Yes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={answer?.result === 'No' ? 'error' : 'outline'}
                onClick={() => handleChecklistChange(item.id, 'No', 'result')}
              >
                No
              </Button>
              <Button
                type="button"
                size="sm"
                variant={answer?.result === 'NA' ? 'default' : 'outline'}
                onClick={() => handleChecklistChange(item.id, 'NA', 'result')}
              >
                N/A
              </Button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      
      case 'Numeric':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={answer?.numericValue?.toString() || ''}
                onChange={(e) => handleChecklistChange(item.id, Number(e.target.value), 'numericValue')}
                placeholder={`Enter value${item.units ? ` (${item.units})` : ''}`}
                className="w-32"
                error={error}
              />
              {item.units && <span className="text-sm text-gray-600">{item.units}</span>}
              {item.expectedValue && (
                <span className="text-xs text-gray-500">
                  (Expected: {item.expectedValue} {item.units || ''})
                </span>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      
      case 'Hours':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={answer?.hoursValue?.toString() || ''}
              onChange={(e) => handleChecklistChange(item.id, Number(e.target.value), 'hoursValue')}
              placeholder={`Enter hours${item.units ? ` (${item.units})` : ''}`}
              className="w-32"
              error={error}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      
      case 'DateTime':
        return (
          <div className="space-y-2">
            <Input
              type="datetime-local"
              value={answer?.dateTimeValue || ''}
              onChange={(e) => handleChecklistChange(item.id, e.target.value, 'dateTimeValue')}
              error={error}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      
      case 'FreeText':
        return (
          <div className="space-y-2">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={answer?.textValue || ''}
              onChange={(e) => handleChecklistChange(item.id, e.target.value, 'textValue')}
              placeholder="Enter text..."
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate PM Task"
      size="large"
    >
      <div className="space-y-6">
        {/* Pre-filled Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
            <div className="text-gray-900">{schedule.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
            <div className="text-gray-900">{schedule.assetTypeCode} {schedule.assetId}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
            <div className="text-gray-900">{schedule.siteName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Team</label>
            <div className="text-gray-900">{schedule.assignedTeam || 'N/A'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <div className="text-gray-900">{new Date(schedule.nextDueDate).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Task Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />
          </div>
          <div>
            <Select
              label="Assigned To"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...mockUsers.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          </div>
          <div>
            <Select
              label="Priority *"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Start Date/Time"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        {/* Checklist */}
        {schedule.checklistItems && schedule.checklistItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Checklist</h3>
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {schedule.checklistItems.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <label className="font-medium text-gray-900">
                        {item.order}. {item.checkItem}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {item.notesGuidance && (
                        <p className="text-xs text-gray-500 mt-1">{item.notesGuidance}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    {renderChecklistInput(item)}
                  </div>
                  
                  {/* Notes */}
                  <Input
                    placeholder="Notes (optional)"
                    value={checklistAnswers[item.id]?.notes || ''}
                    onChange={(e) => handleChecklistChange(item.id, e.target.value, 'notes')}
                    size="sm"
                  />
                  
                  {/* Photo Upload */}
                  <div className="mt-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <span>Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(item.id, file);
                        }}
                      />
                    </label>
                    {itemPhotos[item.id] && (
                      <div className="mt-2 relative inline-block">
                        <img src={itemPhotos[item.id]} alt="Check photo" className="h-20 w-20 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setItemPhotos((prev) => {
                              const updated = { ...prev };
                              delete updated[item.id];
                              return updated;
                            });
                            handleChecklistChange(item.id, undefined, 'photoUri');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Issue Found Toggle */}
                  <div className="mt-4 pt-4 border-t">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistAnswers[item.id]?.issueFound || false}
                        onChange={(e) => handleIssueFoundToggle(item.id, e.target.checked)}
                        className="rounded"
                      />
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span>Issue Found</span>
                    </label>
                    
                    {checklistAnswers[item.id]?.issueFound && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                        <div>
                          <Input
                            label="Issue Title *"
                            value={checklistAnswers[item.id]?.issuePayload?.title || ''}
                            onChange={(e) => handleIssuePayloadChange(item.id, { title: e.target.value })}
                            size="sm"
                            error={errors[`issue-title-${item.id}`]}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description *</label>
                          <textarea
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                              errors[`issue-desc-${item.id}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            rows={3}
                            value={checklistAnswers[item.id]?.issuePayload?.description || ''}
                            onChange={(e) => handleIssuePayloadChange(item.id, { description: e.target.value })}
                            placeholder="Describe the issue..."
                          />
                          {errors[`issue-desc-${item.id}`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`issue-desc-${item.id}`]}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Select
                              label="Severity *"
                              value={checklistAnswers[item.id]?.issuePayload?.severity || 'Medium'}
                              onChange={(e) => handleIssuePayloadChange(item.id, { severity: e.target.value as 'Low' | 'Medium' | 'High' | 'Critical' })}
                              options={[
                                { value: 'Low', label: 'Low' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'High', label: 'High' },
                                { value: 'Critical', label: 'Critical' },
                              ]}
                              size="sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                            <Input
                              type="date"
                              value={checklistAnswers[item.id]?.issuePayload?.targetDate || ''}
                              onChange={(e) => handleIssuePayloadChange(item.id, { targetDate: e.target.value })}
                              size="sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checklistAnswers[item.id]?.issuePayload?.unsafeDoNotUse || false}
                            onChange={(e) => {
                              handleIssuePayloadChange(item.id, { unsafeDoNotUse: e.target.checked });
                              // Auto-enable Work Order if Unsafe
                              if (e.target.checked) {
                                handleIssuePayloadChange(item.id, { createWorkOrder: true });
                              }
                            }}
                            className="rounded"
                          />
                          <label className="text-sm text-gray-700">Unsafe / Do Not Use</label>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Create as:</label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checklistAnswers[item.id]?.issuePayload?.createDefect !== false}
                                onChange={(e) => handleIssuePayloadChange(item.id, { createDefect: e.target.checked })}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-700">Defect</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checklistAnswers[item.id]?.issuePayload?.createWorkOrder || false}
                                onChange={(e) => handleIssuePayloadChange(item.id, { createWorkOrder: e.target.checked })}
                                className="rounded"
                                disabled={checklistAnswers[item.id]?.issuePayload?.unsafeDoNotUse && !checklistAnswers[item.id]?.issuePayload?.createDefect}
                              />
                              <span className="text-sm text-gray-700">Work Order draft</span>
                            </label>
                          </div>
                          {(errors[`issue-action-${item.id}`] || 
                            (checklistAnswers[item.id]?.issuePayload?.unsafeDoNotUse && 
                             !checklistAnswers[item.id]?.issuePayload?.createDefect && 
                             !checklistAnswers[item.id]?.issuePayload?.createWorkOrder)) && (
                            <p className="text-xs text-red-600">⚠️ {errors[`issue-action-${item.id}`] || 'Unsafe issues must create at least one action (Defect or Work Order)'}</p>
                          )}
                        </div>
                        <div>
                          <Select
                            label="Assigned To (optional)"
                            value={checklistAnswers[item.id]?.issuePayload?.assignedToId || ''}
                            onChange={(e) => handleIssuePayloadChange(item.id, { assignedToId: e.target.value || undefined })}
                            options={[
                              { value: '', label: 'Unassigned' },
                              ...mockUsers.map((u) => ({ value: u.id, label: u.name })),
                            ]}
                            size="sm"
                          />
                        </div>
                        {(createdDefectIds[item.id] || createdWorkOrderIds[item.id]) && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {createdDefectIds[item.id] && (
                              <button
                                type="button"
                                onClick={() => navigate(`/defects/${createdDefectIds[item.id]}`)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Defect Draft
                              </button>
                            )}
                            {createdWorkOrderIds[item.id] && (
                              <button
                                type="button"
                                onClick={() => navigate(`/work-orders/${createdWorkOrderIds[item.id]}`)}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View WO Draft
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Description / Notes</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes or work description..."
          />
        </div>

        {/* Attachments */}
        <div>
          <FileUpload
            label="Attachments (Photos/Documents)"
            accept="image/*,.pdf,.doc,.docx,.xlsx"
            files={attachments}
            onFilesChange={setAttachments}
            maxFiles={10}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button type="button" variant="primary" onClick={handleComplete} disabled={isCompleting}>
            {isCompleting ? 'Completing...' : 'Complete Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
