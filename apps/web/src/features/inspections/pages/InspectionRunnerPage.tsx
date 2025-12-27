import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Badge } from '../../../components/common/Badge';
import { CollapsibleCard } from '../../../components/common/CollapsibleCard';
import { Select } from '../../../components/common/Select';
import { useAuth } from '../../../contexts/AuthContext';
import { useInspections } from '../context/InspectionsContext';
import { showToast } from '../../../components/common/Toast';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import type { ChecklistItemAnswer, ChecklistItemResult } from '../types';

export function InspectionRunnerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentInspection,
    loading,
    loadInspection,
    updateInspectionData,
    submitInspectionData,
  } = useInspections();

  const [localAnswers, setLocalAnswers] = useState<ChecklistItemAnswer[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<Record<string, File[]>>({});
  const [photoDataUrls, setPhotoDataUrls] = useState<Record<string, string[]>>({});
  
  // Signature state
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [declarations, setDeclarations] = useState({
    accurate: false,
    defectsRecorded: false,
  });
  const [saveSignature, setSaveSignature] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<{
    result: 'Pass' | 'Fail';
    passCount: number;
    failCount: number;
    photoCount: number;
    signatureUsed: boolean;
  } | null>(null);
  const [incompleteItems, setIncompleteItems] = useState<string[]>([]);
  const [showIncompleteBanner, setShowIncompleteBanner] = useState(false);
  const [lastAutosaveTime, setLastAutosaveTime] = useState<Date | null>(null);
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load inspection
  useEffect(() => {
    if (id) {
      console.log('[Runner] Mounted with id:', id);
      console.log('[Runner] Loading inspection...');
      loadInspection(id).catch((error) => {
        console.error('[Runner] Failed to load inspection:', error);
        showToast(`Failed to load inspection: ${error.message}`, 'error');
      });
    } else {
      console.error('[Runner] No id provided in route params');
      showToast('No inspection ID provided', 'error');
    }
  }, [id, loadInspection]);

  // Handle Start flow (Draft -> InProgress)
  useEffect(() => {
    if (currentInspection && id && currentInspection.status === 'Draft') {
      console.log('[Runner] Starting Draft inspection:', {
        id: currentInspection.id,
        code: currentInspection.inspectionCode,
        templateId: currentInspection.templateId,
      });
      // Start inspection: change status to InProgress and set startedAt
      const now = new Date().toISOString();
      updateInspectionData(id, {
        status: 'InProgress',
        startedAt: now,
      }).then(() => {
        console.log('[Runner] Inspection status updated to InProgress');
      }).catch((error) => {
        console.error('[Runner] Failed to update inspection status:', error);
        showToast(`Failed to start inspection: ${error.message}`, 'error');
      });
    }
  }, [currentInspection, id, updateInspectionData]);

  // Load saved signature on mount
  useEffect(() => {
    const savedSignature = localStorage.getItem('user-signature');
    if (savedSignature) {
      try {
        const sig = JSON.parse(savedSignature);
        setSignatureName(sig.name || '');
        setSignatureConfirmed(true);
      } catch (e) {
        console.warn('Failed to load saved signature:', e);
      }
    }
  }, []);

  // Load answers from localStorage or inspection
  useEffect(() => {
    if (currentInspection && id) {
      console.log('[Runner] Inspection loaded:', {
        id: currentInspection.id,
        code: currentInspection.inspectionCode,
        templateId: currentInspection.templateId,
        templateName: currentInspection.templateName,
        status: currentInspection.status,
        itemsCount: currentInspection.items.length,
        sectionsCount: currentInspection.sections.length,
      });

      const storageKey = `inspection-session-${id}`;
      console.log('[Runner] Looking for session in localStorage:', storageKey);
      
      // Try to load from localStorage first
      const savedSession = localStorage.getItem(storageKey);
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          console.log('[Runner] Session found in localStorage:', session);
          if (session.answers && Array.isArray(session.answers)) {
            console.log('[Runner] Loading', session.answers.length, 'answers from session');
            setLocalAnswers(session.answers);
            
            // Load photo data URLs if present
            if (session.photoDataUrls) {
              setPhotoDataUrls(session.photoDataUrls);
            }
            return;
          }
        } catch (e) {
          console.error('[Runner] Failed to parse saved session:', e);
        }
      } else {
        console.log('[Runner] No session found in localStorage');
      }
      
      // Fallback to inspection answers or initialize empty
      if (currentInspection.answers && currentInspection.answers.length > 0) {
        console.log('[Runner] Loading', currentInspection.answers.length, 'answers from inspection');
        setLocalAnswers([...currentInspection.answers]);
      } else {
        // Initialize empty answers for all items
        console.log('[Runner] Initializing empty answers for', currentInspection.items.length, 'items');
        const initialAnswers: ChecklistItemAnswer[] = currentInspection.items.map((item) => ({
          id: crypto.randomUUID(),
          checklistItemId: item.id,
          result: null,
        }));
        setLocalAnswers(initialAnswers);
      }
    }
  }, [currentInspection, id]);

  // Autosave with debouncing
  useEffect(() => {
    if (id && localAnswers.length > 0 && currentInspection) {
      // Clear existing timeout
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }

      // Set new timeout for debounced save
      const timeout = setTimeout(() => {
        const storageKey = `inspection-session-${id}`;
        const session = {
          inspectionId: id,
          templateId: currentInspection.templateId,
          answers: localAnswers,
          photoDataUrls: photoDataUrls,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(session));
        setLastAutosaveTime(new Date());
        console.log('[Runner] Auto-saved session:', storageKey, { answersCount: localAnswers.length });
      }, 750); // 750ms debounce

      setAutosaveTimeout(timeout);

      // Cleanup on unmount or dependency change
      return () => {
        clearTimeout(timeout);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localAnswers, id, currentInspection, photoDataUrls]);

  const inspection = currentInspection;

  // Single source of truth: is an item answered?
  const isItemAnswered = (item: any, answer: ChecklistItemAnswer | undefined): boolean => {
    if (!answer) return false;
    
    if (item.type === 'PassFail' || item.type === 'PassFailNA') {
      return answer.result === 'Pass' || answer.result === 'Fail' || answer.result === 'NA';
    } else if (item.type === 'Number') {
      const hasValue = answer.numericValue !== null && 
                      answer.numericValue !== undefined && 
                      !isNaN(answer.numericValue) &&
                      answer.numericValue !== '';
      // If item has units, we don't require unit selection (default to first unit if missing)
      return hasValue;
    } else if (item.type === 'Text') {
      return answer.textValue !== null && 
             answer.textValue !== undefined && 
             answer.textValue.trim().length > 0;
    } else if (item.type === 'Photo') {
      // Photo is only required if item.required is true
      if (item.required) {
        return (answer.photoUris && answer.photoUris.length > 0) || !!answer.photoUri;
      }
      // Optional photo items are considered answered even without photos
      return true;
    }
    return false;
  };

  // Calculate progress using single source of truth
  const progress = useMemo(() => {
    if (!inspection) return { completed: 0, total: 0, percentage: 0 };
    const total = inspection.items.length;
    const completed = inspection.items.filter((item) => {
      const answer = localAnswers.find((a) => a.checklistItemId === item.id);
      return isItemAnswered(item, answer);
    }).length;
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [inspection, localAnswers]);

  // Group items by section
  const itemsBySection = useMemo(() => {
    if (!inspection) return [];
    
    if (inspection.sections.length > 0) {
      return inspection.sections.map((section) => ({
        section,
        items: inspection.items.filter((i) => i.sectionId === section.id),
      }));
    }
    return [{ section: null, items: inspection.items }];
  }, [inspection]);

  // Load next inspections for completion screen (must be before conditional returns)
  const [nextInspectionsList, setNextInspectionsList] = useState<any[]>([]);
  useEffect(() => {
    if (showCompletionScreen && inspection) {
      import('../services').then(({ getInspections }) => {
        const all = getInspections();
        const filtered = all
          .filter((ins: any) => 
            ins.id !== inspection.id && 
            (ins.status === 'Draft' || ins.status === 'InProgress')
          )
          .sort((a: any, b: any) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            return dateA - dateB;
          });
        setNextInspectionsList(filtered);
      });
    } else {
      setNextInspectionsList([]);
    }
  }, [showCompletionScreen, inspection]);

  const handleAnswerChange = (
    itemId: string,
    result: ChecklistItemResult,
    value?: string | number,
    unit?: string
  ) => {
    const existingIndex = localAnswers.findIndex((a) => a.checklistItemId === itemId);
    const item = inspection?.items.find((i) => i.id === itemId);
    const existingAnswer = existingIndex >= 0 ? localAnswers[existingIndex] : null;
    
    if (!item) return;

    // Toggle behavior: if clicking same Pass/Fail value, clear it
    if ((item.type === 'PassFail' || item.type === 'PassFailNA') && result !== null) {
      if (existingAnswer?.result === result) {
        // Clear the answer
        if (existingIndex >= 0) {
          const updated = [...localAnswers];
          updated[existingIndex] = {
            ...updated[existingIndex],
            result: null,
            comment: undefined, // Clear comment when clearing answer
          };
          setLocalAnswers(updated);
        }
        return;
      }
    }

    // Convert string to number for Number type
    let numericValue: number | undefined = undefined;
    if (item.type === 'Number' && value !== undefined && value !== null) {
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        numericValue = isNaN(parsed) ? undefined : parsed;
      } else {
        numericValue = value;
      }
    }

    const newAnswer: ChecklistItemAnswer = {
      id: existingIndex >= 0 ? localAnswers[existingIndex].id : crypto.randomUUID(),
      checklistItemId: itemId,
      result,
      ...(item.type === 'Number' && numericValue !== undefined && { numericValue }),
      ...(item.type === 'Number' && unit && { unit }),
      ...(item.type === 'Text' && typeof value === 'string' && { textValue: value }),
    };

    if (existingIndex >= 0) {
      const updated = [...localAnswers];
      updated[existingIndex] = newAnswer;
      setLocalAnswers(updated);
    } else {
      setLocalAnswers([...localAnswers, newAnswer]);
    }

    // Clear error for this item
    if (errors[itemId]) {
      const newErrors = { ...errors };
      delete newErrors[itemId];
      setErrors(newErrors);
    }

    // Remove from incomplete items if now answered
    setIncompleteItems((prev) => prev.filter((id) => id !== itemId));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    const existingIndex = localAnswers.findIndex((a) => a.checklistItemId === itemId);
    if (existingIndex >= 0) {
      const updated = [...localAnswers];
      updated[existingIndex] = { ...updated[existingIndex], comment };
      setLocalAnswers(updated);
    }
  };

  const handlePhotoUpload = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    setPhotoFiles((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...fileArray],
    }));

    // Convert to base64 for localStorage storage
    const item = inspection?.items.find((i) => i.id === itemId);
    if (item) {
      const dataUrls: string[] = [];
      
      // Process each file
      for (const file of fileArray) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        dataUrls.push(dataUrl);
      }
      
      // Update photo data URLs
      setPhotoDataUrls((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), ...dataUrls],
      }));
      
      // Update answer
      const existingIndex = localAnswers.findIndex((a) => a.checklistItemId === itemId);
      if (existingIndex >= 0) {
        const updated = [...localAnswers];
        updated[existingIndex] = {
          ...updated[existingIndex],
          photoUris: [...(updated[existingIndex].photoUris || []), ...dataUrls],
        };
        setLocalAnswers(updated);
      } else {
        const newAnswer: ChecklistItemAnswer = {
          id: crypto.randomUUID(),
          checklistItemId: itemId,
          result: null,
          photoUris: dataUrls,
        };
        setLocalAnswers([...localAnswers, newAnswer]);
      }
    }
  };

  const handleRemovePhoto = (itemId: string, photoIndex: number) => {
    setPhotoDataUrls((prev) => {
      const current = prev[itemId] || [];
      const updated = current.filter((_, i) => i !== photoIndex);
      return { ...prev, [itemId]: updated };
    });
    
    const existingIndex = localAnswers.findIndex((a) => a.checklistItemId === itemId);
    if (existingIndex >= 0) {
      const updated = [...localAnswers];
      updated[existingIndex] = {
        ...updated[existingIndex],
        photoUris: (updated[existingIndex].photoUris || []).filter((_, i) => i !== photoIndex),
      };
      setLocalAnswers(updated);
    }
  };

  const validate = (): boolean => {
    if (!inspection) return false;
    
    const newErrors: Record<string, string> = {};
    const incomplete: string[] = [];
    
    // Check required items using single source of truth
    for (const item of inspection.items) {
      if (item.required) {
        const answer = localAnswers.find((a) => a.checklistItemId === item.id);
        
        if (!isItemAnswered(item, answer)) {
          newErrors[item.id] = 'This item is required';
          incomplete.push(item.id);
        }
        
        // Check if fail requires comment
        if (answer?.result === 'Fail') {
          if (!answer.comment || answer.comment.trim() === '') {
            newErrors[item.id] = 'Comment is required when item fails';
            if (!incomplete.includes(item.id)) incomplete.push(item.id);
          }
          
          // Check if fail requires photo
          if (item.photoRequiredOnFail && !answer.photoUri && !photoFiles[item.id]?.length) {
            newErrors[item.id] = 'Photo is required when item fails';
            if (!incomplete.includes(item.id)) incomplete.push(item.id);
          }
        }
      }
    }
    
    setErrors(newErrors);
    setIncompleteItems(incomplete);
    
    // Developer diagnostic
    if (incomplete.length > 0) {
      console.log('[Runner] Incomplete items:', incomplete.map((itemId) => {
        const item = inspection.items.find((i) => i.id === itemId);
        const section = item ? inspection.sections.find((s) => s.id === item.sectionId) : null;
        return {
          id: itemId,
          label: item?.question || 'Unknown',
          section: section?.title || 'No section',
        };
      }));
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndExit = async () => {
    if (!inspection || !user || !id) return;
    
    setIsSaving(true);
    try {
      // Force save immediately
      const storageKey = `inspection-session-${id}`;
      const session = {
        inspectionId: id,
        templateId: inspection.templateId,
        answers: localAnswers,
        photoDataUrls: photoDataUrls,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(session));
      setLastAutosaveTime(new Date());
      
      // Update inspection data
      await updateInspectionData(inspection.id, {
        answers: localAnswers,
        status: 'InProgress',
        startedAt: inspection.startedAt || new Date().toISOString(),
        updatedBy: user.id,
        updatedByName: `${user.firstName} ${user.lastName}`,
      });
      
      showToast('Progress saved (queued for sync)', 'success');
      navigate('/inspections');
    } catch (error: any) {
      showToast(`Error saving: ${error.message}`, 'error');
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!inspection || !user || !id) return;
    
    if (!validate()) {
      const incompleteCount = incompleteItems.length;
      setShowIncompleteBanner(true);
      showToast(`${incompleteCount} check${incompleteCount !== 1 ? 's' : ''} incomplete`, 'error');
      
      // Scroll to first incomplete item
      if (incompleteItems.length > 0) {
        const firstIncompleteId = incompleteItems[0];
        const element = document.getElementById(`item-${firstIncompleteId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // Show signature step instead of immediate completion
    setShowSignatureStep(true);
  };

  const handleShowIncomplete = () => {
    if (incompleteItems.length === 0) return;
    
    // Expand sections with incomplete items
    const sectionsWithIncomplete = new Set(
      incompleteItems.map((itemId) => {
        const item = inspection?.items.find((i) => i.id === itemId);
        return item?.sectionId;
      }).filter(Boolean)
    );
    
    // Scroll to first incomplete item
    const firstIncompleteId = incompleteItems[0];
    const element = document.getElementById(`item-${firstIncompleteId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSignatureComplete = async () => {
    if (!inspection || !user || !id) return;
    
    // Validate signature
    if (!signatureName.trim()) {
      showToast('Please enter your name to sign', 'error');
      return;
    }
    
    if (!declarations.accurate || !declarations.defectsRecorded) {
      showToast('Please confirm all declarations', 'error');
      return;
    }

    // Save signature if requested
    if (saveSignature) {
      localStorage.setItem('user-signature', JSON.stringify({
        name: signatureName,
        savedAt: new Date().toISOString(),
      }));
    }

    setIsSaving(true);
    try {
      // Calculate overall result and summary
      const hasFail = localAnswers.some((a) => a.result === 'Fail');
      const result = hasFail ? 'Fail' : 'Pass';
      const passCount = localAnswers.filter((a) => a.result === 'Pass').length;
      const failCount = localAnswers.filter((a) => a.result === 'Fail').length;
      const photoCount = Object.values(photoDataUrls).reduce((sum, urls) => sum + urls.length, 0) +
                        localAnswers.filter((a) => a.photoUri || a.photoUris?.length).length;
      
      const completedAt = new Date().toISOString();
      
      // Update inspection with final answers and status
      await updateInspectionData(inspection.id, {
        answers: localAnswers,
        status: 'Closed',
        result: result as 'Pass' | 'Fail' | 'Pending',
        completedAt: completedAt,
        signatures: [{
          id: crypto.randomUUID(),
          role: 'inspector',
          method: 'typed',
          signature: signatureName,
          signedAt: completedAt,
          signedBy: user.id,
          signedByName: `${user.firstName} ${user.lastName}`,
        }],
        updatedBy: user.id,
        updatedByName: `${user.firstName} ${user.lastName}`,
      });
      
      // Set completion summary
      setCompletionSummary({
        result,
        passCount,
        failCount,
        photoCount,
        signatureUsed: true,
      });
      
      // Clear localStorage session
      const storageKey = `inspection-session-${id}`;
      localStorage.removeItem(storageKey);
      
      // Show completion screen
      setShowSignatureStep(false);
      setShowCompletionScreen(true);
      
      showToast('Inspection completed and saved to system', 'success');
    } catch (error: any) {
      showToast(`Error completing: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getResultBadge = (result: string | null) => {
    if (result === 'Pass') {
      return <Badge variant="success">Pass</Badge>;
    }
    if (result === 'Fail') {
      return <Badge variant="error">Fail</Badge>;
    }
    if (result === 'NA') {
      return <Badge variant="default">N/A</Badge>;
    }
    return <Badge variant="warning">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-gray-500">Loading inspection...</div>
        </Card>
      </div>
    );
  }

  if (!inspection) {
    console.error('[Runner] Inspection not found for id:', id);
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center space-y-4">
            <div className="text-gray-500">Inspection not found</div>
            <div className="text-sm text-gray-400">ID: {id}</div>
            <Button onClick={() => navigate('/inspections')}>
              Back to Inspections
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Verify template is loaded
  if (!inspection.templateId || !inspection.items || inspection.items.length === 0) {
    console.error('[Runner] Inspection missing template or items:', {
      id: inspection.id,
      templateId: inspection.templateId,
      itemsCount: inspection.items?.length || 0,
    });
    showToast('Inspection template not loaded. Please try again.', 'error');
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center space-y-4">
            <div className="text-red-600">Template not found for this inspection</div>
            <div className="text-sm text-gray-400">Template ID: {inspection.templateId || 'missing'}</div>
            <Button onClick={() => navigate('/inspections')}>
              Back to Inspections
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Check if already completed
  if (inspection.status === 'Closed' || inspection.status === 'Approved' || inspection.status === 'Submitted') {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center space-y-4">
            <div className="text-gray-500">This inspection has already been submitted.</div>
            <Button onClick={() => navigate(`/inspections/${inspection.id}`)}>
              View Details
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Completion Success Screen
  if (showCompletionScreen && completionSummary) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center space-y-6">
            <div className="text-6xl">✅</div>
            <div className="text-2xl font-bold text-gray-900">Inspection Completed</div>
            <div className="space-y-2 text-gray-600">
              <div>Result: <Badge variant={completionSummary.result === 'Pass' ? 'success' : 'error'}>{completionSummary.result}</Badge></div>
              <div>Pass: {completionSummary.passCount} | Fail: {completionSummary.failCount}</div>
              <div>Photos: {completionSummary.photoCount}</div>
              <div>Signed: {completionSummary.signatureUsed ? 'Yes' : 'No'}</div>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              {nextInspectionsList.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Go to Next Inspection</label>
                  <Select
                    options={[
                      { value: '', label: '-- Select --' },
                      ...nextInspectionsList.map((ins: any) => ({
                        value: ins.id,
                        label: `${ins.inspectionCode} - ${ins.templateName} (${ins.status})`
                      }))
                    ]}
                    onChange={(e) => {
                      if (e.target.value) {
                        navigate(`/inspections/run/${e.target.value}`);
                      }
                    }}
                  />
                </div>
              )}
              <Button
                variant="primary"
                onClick={() => navigate('/inspections')}
              >
                Back to Inspections List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Signature Step
  if (showSignatureStep) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-6 space-y-6">
            <div className="text-xl font-bold">Complete Inspection</div>
            
            {/* Declarations */}
            <div className="space-y-3">
              <div className="font-medium">Confirmations:</div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarations.accurate}
                  onChange={(e) => setDeclarations({ ...declarations, accurate: e.target.checked })}
                  className="mt-1"
                />
                <span>I confirm these checks were completed accurately.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarations.defectsRecorded}
                  onChange={(e) => setDeclarations({ ...declarations, defectsRecorded: e.target.checked })}
                  className="mt-1"
                />
                <span>I confirm all defects found have been recorded.</span>
              </label>
            </div>

            {/* Signature */}
            <div className="space-y-3">
              <div className="font-medium">Signature:</div>
              <Input
                label="Your Name"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatureConfirmed}
                  onChange={(e) => setSignatureConfirmed(e.target.checked)}
                />
                <span>I confirm this signature</span>
              </label>
            </div>

            {/* Save Signature */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveSignature}
                onChange={(e) => setSaveSignature(e.target.checked)}
              />
              <span>Save signature for next time</span>
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSignatureStep(false)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSignatureComplete}
                disabled={isSaving || !signatureName.trim() || !signatureConfirmed || !declarations.accurate || !declarations.defectsRecorded}
              >
                {isSaving ? 'Completing...' : 'Complete Inspection'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Incomplete Items Banner */}
      {showIncompleteBanner && incompleteItems.length > 0 && (
        <div className="sticky top-0 z-20 bg-yellow-50 border-b border-yellow-200 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="warning">{incompleteItems.length} check{incompleteItems.length !== 1 ? 's' : ''} incomplete</Badge>
                <div className="text-sm text-gray-700">
                  {incompleteItems.slice(0, 3).map((itemId) => {
                    const item = inspection?.items.find((i) => i.id === itemId);
                    const section = item ? inspection?.sections.find((s) => s.id === item.sectionId) : null;
                    return (
                      <span key={itemId} className="mr-3">
                        • {section?.title || 'No section'} → {item?.question || 'Unknown'}
                      </span>
                    );
                  })}
                  {incompleteItems.length > 3 && ` +${incompleteItems.length - 3} more`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShowIncomplete}
                >
                  Show Incomplete
                </Button>
                <button
                  onClick={() => setShowIncompleteBanner(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className={`sticky ${showIncompleteBanner ? 'top-[73px]' : 'top-0'} z-10 bg-white border-b border-gray-200 shadow-sm`}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold font-mono text-gray-900">
                  {inspection.inspectionCode}
                </span>
                <Badge variant="warning" size="sm">In Progress</Badge>
              </div>
              <div className="text-base text-gray-700 mb-1">{inspection.templateName}</div>
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                <div>
                  Asset:{' '}
                  <button
                    onClick={() => navigate(`/assets/${inspection.assetId}`)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-mono"
                  >
                    {inspection.assetId}
                  </button>
                </div>
                {inspection.siteName && <div>Site: {inspection.siteName}</div>}
                <div>Inspector: {inspection.inspectorName}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  {progress.completed} / {progress.total}
                </span>
              </div>
            </div>

            {/* Actions - Far Right */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  Complete Inspection
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveAndExit}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save & Exit'}
                </Button>
              </div>
              {lastAutosaveTime && (
                <div className="text-xs text-gray-500">
                  Autosaved {lastAutosaveTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Content */}
      <div className="p-6 space-y-4">
        {itemsBySection.map(({ section, items }) => (
          <CollapsibleCard
            key={section?.id || 'no-section'}
            title={section?.title || 'Checklist Items'}
          >
            <div className="space-y-4">
              {items.map((item) => {
                const answer = localAnswers.find((a) => a.checklistItemId === item.id);
                const hasError = !!errors[item.id];

                const isIncomplete = incompleteItems.includes(item.id);
                const isAnswered = isItemAnswered(item, answer);

                return (
                  <div
                    id={`item-${item.id}`}
                    key={item.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      hasError 
                        ? 'border-red-300 bg-red-50' 
                        : isIncomplete 
                        ? 'border-yellow-400 bg-yellow-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{item.question}</span>
                          {item.required && <span className="text-red-500">*</span>}
                        {(item.safetyCritical || (item as any).critical) && (
                          <Badge variant="error" size="sm">Safety Critical</Badge>
                        )}
                        </div>
                        {item.photoRequiredOnFail && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Camera className="w-3 h-3" />
                            Photo required on fail
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isIncomplete && (
                          <Badge variant="warning" size="sm">Incomplete</Badge>
                        )}
                        {isAnswered && answer && (
                          <div>{getResultBadge(answer.result)}</div>
                        )}
                        {!isAnswered && !isIncomplete && (
                          <Badge variant="default" size="sm" className="opacity-50">Pending</Badge>
                        )}
                      </div>
                    </div>

                    {/* Answer Controls */}
                    {item.type === 'PassFail' || item.type === 'PassFailNA' ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={answer?.result === 'Pass' ? 'primary' : 'outline'}
                            onClick={() => handleAnswerChange(item.id, 'Pass')}
                            className={answer?.result === null ? 'opacity-60' : ''}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Pass
                          </Button>
                          <Button
                            size="sm"
                            variant={answer?.result === 'Fail' ? 'outline' : 'outline'}
                            onClick={() => handleAnswerChange(item.id, 'Fail')}
                            className={answer?.result === 'Fail' ? 'bg-red-50 border-red-300 text-red-700' : answer?.result === null ? 'opacity-60' : ''}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Fail
                          </Button>
                          {item.type === 'PassFailNA' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Toggle NA: if already NA, clear it
                                if (answer?.result === 'NA') {
                                  handleAnswerChange(item.id, null);
                                } else {
                                  handleAnswerChange(item.id, 'NA');
                                }
                              }}
                              className={answer?.result === 'NA' ? 'bg-gray-100' : answer?.result === null ? 'opacity-60' : ''}
                            >
                              N/A
                            </Button>
                          )}
                        </div>

                        {/* Comment field (always show, required on fail) */}
                        {(answer?.result === 'Fail' || answer?.result === 'NA') && (
                          <div>
                            <textarea
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                hasError && !answer.comment ? 'border-red-300' : 'border-gray-300'
                              }`}
                              rows={2}
                              placeholder={
                                answer?.result === 'Fail'
                                  ? 'Comment required for failures *'
                                  : 'Add comment (optional)...'
                              }
                              value={answer?.comment || ''}
                              onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            />
                          </div>
                        )}

                        {/* Photo upload (required on fail) */}
                        {answer?.result === 'Fail' && item.photoRequiredOnFail && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Photo (Required) *
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                id={`photo-${item.id}`}
                                onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                              />
                              <label
                                htmlFor={`photo-${item.id}`}
                                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                <Camera className="w-4 h-4" />
                                {photoFiles[item.id]?.length || answer?.photoUri
                                  ? `${photoFiles[item.id]?.length || 1} photo(s)`
                                  : 'Upload Photo'}
                              </label>
                              {answer?.photoUri && (
                                <img
                                  src={answer.photoUri}
                                  alt="Uploaded"
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : item.type === 'Number' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={answer?.numericValue || ''}
                            onChange={(e) =>
                              handleAnswerChange(
                                item.id,
                                null,
                                e.target.value ? parseFloat(e.target.value) : undefined,
                                answer?.unit || item.unit
                              )
                            }
                            placeholder="Enter value"
                            min={item.minValue}
                            max={item.maxValue}
                            error={hasError ? errors[item.id] : undefined}
                            className="flex-1"
                          />
                          {item.unit && (
                            <span className="text-sm text-gray-600 whitespace-nowrap">{item.unit}</span>
                          )}
                        </div>
                        {(answer?.result === 'Fail' || answer?.result === 'NA') && (
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                            placeholder="Add comment (optional)..."
                            value={answer?.comment || ''}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          />
                        )}
                      </div>
                    ) : item.type === 'Photo' ? (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            multiple
                            className="hidden"
                            id={`photo-item-${item.id}`}
                            onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                          />
                          <label
                            htmlFor={`photo-item-${item.id}`}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                          >
                            <Camera className="w-4 h-4" />
                            Add Photo
                          </label>
                        </div>
                        {(photoDataUrls[item.id]?.length > 0 || answer?.photoUris?.length > 0) && (
                          <div className="grid grid-cols-3 gap-2">
                            {(photoDataUrls[item.id] || answer?.photoUris || []).map((photoUrl, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={photoUrl}
                                  alt={`Photo ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                />
                                <button
                                  onClick={() => handleRemovePhoto(item.id, idx)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                  type="button"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {answer && (
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                            placeholder="Add comment (optional)..."
                            value={answer.comment || ''}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            hasError ? 'border-red-300' : 'border-gray-300'
                          }`}
                          rows={3}
                          placeholder="Enter text..."
                          value={answer?.textValue || ''}
                          onChange={(e) =>
                            handleAnswerChange(item.id, null, e.target.value)
                          }
                        />
                        {answer && (
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                            placeholder="Add comment (optional)..."
                            value={answer.comment || ''}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          />
                        )}
                      </div>
                    )}

                    {hasError && (
                      <p className="text-xs text-red-600 mt-2">{errors[item.id]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}

