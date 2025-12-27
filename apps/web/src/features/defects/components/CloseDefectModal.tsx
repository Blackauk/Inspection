import { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Upload, X } from 'lucide-react';
import type { Defect, DefectAttachment } from '../types';

interface CloseDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defect: Defect;
  onCloseDefect: (data: {
    actionTaken: string;
    notes: string;
    attachments: DefectAttachment[];
    returnToService?: boolean;
  }) => Promise<void>;
}

export function CloseDefectModal({
  isOpen,
  onClose,
  defect,
  onCloseDefect,
}: CloseDefectModalProps) {
  const [actionTaken, setActionTaken] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<DefectAttachment[]>([]);
  const [returnToService, setReturnToService] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newAttachments: DefectAttachment[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = file.type.startsWith('image/') ? 'photo' : 
                        file.type.startsWith('video/') ? 'video' : 'document';
        
        // Create blob URL for preview
        const uri = URL.createObjectURL(file);
        
        newAttachments.push({
          id: crypto.randomUUID(),
          type: fileType,
          filename: file.name,
          uri,
          createdAt: new Date().toISOString(),
          label: 'other',
        });
      }
      
      setAttachments([...attachments, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment && attachment.uri.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.uri);
    }
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!actionTaken || !notes.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      await onCloseDefect({
        actionTaken,
        notes,
        attachments,
        returnToService: defect.unsafeDoNotUse ? returnToService : undefined,
      });
      
      // Reset form
      setActionTaken('');
      setNotes('');
      setAttachments([]);
      setReturnToService(false);
      onClose();
    } catch (error: any) {
      alert(`Error closing defect: ${error.message}`);
    }
  };

  const handleClose = () => {
    // Clean up blob URLs
    attachments.forEach(att => {
      if (att.uri.startsWith('blob:')) {
        URL.revokeObjectURL(att.uri);
      }
    });
    setActionTaken('');
    setNotes('');
    setAttachments([]);
    setReturnToService(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Close Defect" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Taken <span className="text-red-600">*</span>
          </label>
          <Select
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            options={[
              { value: '', label: 'Select action...' },
              { value: 'Repaired', label: 'Repaired' },
              { value: 'Replaced', label: 'Replaced' },
              { value: 'Adjusted', label: 'Adjusted' },
              { value: 'Cleaned', label: 'Cleaned' },
              { value: 'Isolated', label: 'Isolated' },
              { value: 'Temporary Fix', label: 'Temporary Fix' },
              { value: 'Other', label: 'Other' },
            ]}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Close-out Notes <span className="text-red-600">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what was done to resolve this defect..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-gray-500 mt-1">
                Images, videos, or documents
              </span>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative border border-gray-200 rounded-lg p-2"
                >
                  {attachment.type === 'photo' && (
                    <img
                      src={attachment.uri}
                      alt={attachment.filename}
                      className="w-full h-24 object-cover rounded"
                    />
                  )}
                  {attachment.type !== 'photo' && (
                    <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600 truncate">
                        {attachment.filename}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {defect.unsafeDoNotUse && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="return-to-service"
              checked={returnToService}
              onChange={(e) => setReturnToService(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="return-to-service" className="text-sm text-gray-700">
              Return asset to service (clear "Unsafe - Do Not Use" flag)
            </label>
          </div>
        )}

        {defect.beforeAfterRequired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Before and after photos are required for this defect.
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!actionTaken || !notes.trim() || uploading}
          >
            Close Defect
          </Button>
        </div>
      </div>
    </Modal>
  );
}

