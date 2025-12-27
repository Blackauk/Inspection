import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { CheckCircle, Copy, Download, ArrowLeft, Plus, Image as ImageIcon } from 'lucide-react';
import { getFitterHandoverById } from '../services';
import { showToast } from '../../../components/common/Toast';
import type { FitterHandover } from '../types';

export function HandoverSubmittedPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [handover, setHandover] = useState<FitterHandover | null>(null);

  useEffect(() => {
    if (id) {
      const found = getFitterHandoverById(id);
      setHandover(found || null);
    }
  }, [id]);

  // Copy image to clipboard
  const handleCopyImage = async () => {
    if (!shareCardRef.current) return;

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality for WhatsApp
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          // Fallback to text copy
          handleCopyText();
          return;
        }

        try {
          // Check if ClipboardItem is supported
          if (typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            showToast('Copied to clipboard — paste into WhatsApp ✅', 'success');
          } else {
            // Fallback: create download link
            handleCopyText();
          }
        } catch (err) {
          console.error('Failed to copy image:', err);
          // Fallback to text copy
          handleCopyText();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate image:', err);
      showToast('Image copy not supported — text copied instead', 'info');
      handleCopyText();
    }
  };

  // Copy text version to clipboard
  const handleCopyText = async () => {
    if (!handover) return;

    const text = formatHandoverAsText(handover);
    
    try {
      await navigator.clipboard.writeText(text);
      showToast('Text copied to clipboard', 'success');
    } catch (err) {
      console.error('Failed to copy text:', err);
      showToast('Failed to copy text', 'error');
    }
  };

  // Format handover as plain text for WhatsApp
  const formatHandoverAsText = (h: FitterHandover): string => {
    let text = '🔧 MECHANICAL SHIFT HANDOVER\n\n';
    
    // Meta row
    text += `📅 ${new Date(h.date).toLocaleDateString()}\n`;
    text += `📍 ${h.siteName}\n`;
    text += `🕐 ${h.shiftType} (${h.shiftPattern})\n`;
    text += `🏢 Locations: ${h.locations.join(', ')}\n\n`;

    // Personnel
    if (h.personnel && h.personnel.length > 0) {
      text += '👥 Personnel:\n';
      h.personnel.forEach(p => {
        text += `   • ${p.name} - ${p.occupation}`;
        if (p.location) text += ` (${p.location})`;
        if (p.remarks) text += ` - ${p.remarks}`;
        text += '\n';
      });
      text += '\n';
    }

    // Tasks Completed
    if (h.tasksCompleted && h.tasksCompleted.length > 0) {
      text += '✅ Tasks Completed:\n';
      h.tasksCompleted.forEach(task => {
        text += `   • ${task.description}`;
        if (task.location) text += ` [${task.location}]`;
        if (task.assetReference) text += ` (Asset: ${task.assetReference})`;
        if (task.status === 'PartiallyCompleted') text += ' [Partially Completed]';
        if (task.requiresFollowUp) text += ' ⚠️ Follow-up required';
        text += '\n';
      });
      text += '\n';
    }

    // Shift Comments
    if (h.shiftComments) {
      text += '📝 Shift Comments:\n';
      text += `${h.shiftComments}\n\n`;
    }

    // Next Shift Notes
    if (h.nextShiftNotes) {
      text += '⚠️ Next Shift Notes:\n';
      text += `${h.nextShiftNotes}\n\n`;
    }

    // Materials Used
    if (h.materialsUsed && h.materialsUsed.length > 0) {
      text += '🔩 Materials Used:\n';
      h.materialsUsed.forEach(m => {
        text += `   • ${m.item}`;
        if (m.qty) text += ` — ${m.qty}`;
        if (m.unit) text += ` ${m.unit}`;
        if (m.notes) text += ` (${m.notes})`;
        text += '\n';
      });
      text += '\n';
    }

    // Materials Required
    if (h.materialsRequired && h.materialsRequired.length > 0) {
      text += '📦 Materials Required Next Shift:\n';
      h.materialsRequired.forEach(m => {
        text += `   • ${m.item}`;
        if (m.qty) text += ` — ${m.qty}`;
        if (m.unit) text += ` ${m.unit}`;
        if (m.notes) text += ` (${m.notes})`;
        text += '\n';
      });
      text += '\n';
    }

    // Footer
    text += `\nSubmitted by: ${h.fitterName}\n`;
    text += `Submitted at: ${new Date(h.updatedAt).toLocaleString()}\n`;
    text += `Handover ID: ${h.id}`;

    return text;
  };

  const handleCreateAnother = () => {
    if (handover) {
      // Navigate to handovers list and open create modal with pre-filled data
      // We'll use location state to pass prefilled data
      navigate('/handovers', { 
        state: { 
          prefilledSite: handover.siteId,
          prefilledShiftPattern: handover.shiftPattern,
          openCreateModal: true,
        } 
      });
    } else {
      navigate('/handovers');
    }
  };

  if (!handover) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Handover not found</p>
        <Link to="/handovers" className="text-blue-600 hover:underline">
          Back to Handovers
        </Link>
      </div>
    );
  }

  const photoCount = handover.attachments?.length || 0;
  const photosToShow = handover.attachments?.slice(0, 4) || [];
  const remainingPhotos = Math.max(0, photoCount - 4);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Confirmation Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <h1 className="text-lg font-semibold text-green-900">Handover submitted ✅</h1>
          <p className="text-sm text-green-700">Your handover has been sent for supervisor review.</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleCopyImage} className="flex-1">
          <Copy className="w-4 h-4 mr-2" />
          Copy to WhatsApp
        </Button>
        <Button onClick={handleCopyText} variant="outline" className="flex-1">
          <Copy className="w-4 h-4 mr-2" />
          Copy Text Version
        </Button>
        <Link to="/handovers">
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Handovers
          </Button>
        </Link>
      </div>

      {/* Helper Tip */}
      <p className="text-sm text-gray-600 text-center">
        💡 Tip: Open WhatsApp → Paste into the group chat
      </p>

      {/* Share Card */}
      <div 
        ref={shareCardRef}
        className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-lg"
        style={{ maxWidth: '600px', margin: '0 auto' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            MECHANICAL SHIFT HANDOVER
          </h2>
        </div>

        {/* Meta Row */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div><span className="font-semibold">Date:</span> {new Date(handover.date).toLocaleDateString()}</div>
            <div><span className="font-semibold">Site:</span> {handover.siteName}</div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div><span className="font-semibold">Shift:</span> {handover.shiftType} ({handover.shiftPattern})</div>
            <div><span className="font-semibold">Locations:</span> {handover.locations.join(', ')}</div>
          </div>
        </div>

        {/* Personnel Summary */}
        {handover.personnel && handover.personnel.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Personnel</h3>
            <ul className="space-y-1 text-sm">
              {handover.personnel.map((p, idx) => (
                <li key={idx}>
                  • <span className="font-medium">{p.name}</span> — {p.occupation}
                  {p.location && <span className="text-gray-600"> ({p.location})</span>}
                  {p.remarks && <span className="text-gray-600"> — {p.remarks}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tasks Completed */}
        {handover.tasksCompleted && handover.tasksCompleted.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Tasks Completed</h3>
            <ul className="space-y-2 text-sm">
              {handover.tasksCompleted.map((task, idx) => (
                <li key={task.id || idx} className="flex items-start gap-2">
                  <span>•</span>
                  <div className="flex-1">
                    <span>{task.description}</span>
                    {task.location && <span className="text-gray-600"> [<span className="font-medium">{task.location}</span>]</span>}
                    {task.assetReference && <span className="text-gray-600"> (Asset: <span className="font-medium">{task.assetReference}</span>)</span>}
                    {task.status === 'PartiallyCompleted' && <span className="text-amber-600 font-medium"> [Partially Completed]</span>}
                    {task.requiresFollowUp && <span className="text-red-600 font-semibold"> ⚠️ Follow-up required</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Shift Comments */}
        {handover.shiftComments && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Shift Comments</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
              {handover.shiftComments}
            </div>
          </div>
        )}

        {/* Next Shift Notes */}
        {handover.nextShiftNotes && (
          <div className="mb-4 pb-4 border-b border-gray-200 bg-amber-50 p-3 rounded border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">⚠️ Next Shift Notes</h3>
            <div className="text-sm text-amber-900 whitespace-pre-wrap">
              {handover.nextShiftNotes}
            </div>
          </div>
        )}

        {/* Materials Used */}
        {handover.materialsUsed && handover.materialsUsed.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Materials Used</h3>
            <ul className="space-y-1 text-sm">
              {handover.materialsUsed.map((m, idx) => (
                <li key={idx}>
                  • {m.item}
                  {m.qty && <span> — {m.qty}</span>}
                  {m.unit && <span> {m.unit}</span>}
                  {m.notes && <span className="text-gray-600"> ({m.notes})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Materials Required Next Shift */}
        {handover.materialsRequired && handover.materialsRequired.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Materials Required Next Shift</h3>
            <ul className="space-y-1 text-sm">
              {handover.materialsRequired.map((m, idx) => (
                <li key={idx}>
                  • {m.item}
                  {m.qty && <span> — {m.qty}</span>}
                  {m.unit && <span> {m.unit}</span>}
                  {m.notes && <span className="text-gray-600"> ({m.notes})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Photos */}
        {photoCount > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Photos</h3>
            <div className="grid grid-cols-2 gap-2">
              {photosToShow.map((photo, idx) => (
                <div key={photo.id || idx} className="aspect-square bg-gray-100 rounded border border-gray-300 flex flex-col items-center justify-center p-2">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 text-center truncate w-full">{photo.name}</span>
                </div>
              ))}
              {remainingPhotos > 0 && (
                <div className="aspect-square bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">+{remainingPhotos} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-gray-600 space-y-1 pt-4 border-t border-gray-300">
          <div>Submitted by: <span className="font-medium">{handover.fitterName}</span> • {new Date(handover.updatedAt).toLocaleString()}</div>
          <div>Handover ID: <span className="font-mono font-medium">{handover.id}</span></div>
        </div>
      </div>

      {/* Create Another Button */}
      <div className="flex justify-center">
        <Button onClick={handleCreateAnother} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Create Another Handover
        </Button>
      </div>
    </div>
  );
}

