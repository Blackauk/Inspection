import { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Upload, X } from 'lucide-react';
import type { Defect, DefectAttachment } from '../types';

interface ReopenDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defect: Defect;
  onReopen: (data: {
    isNewOccurrence: boolean;
    reason: string;
    attachments?: DefectAttachment[];
  }) => Promise<void | string>;
  title?: string;
  isUpdateModal?: boolean;
}

export function ReopenDefectModal({
  isOpen,
  onClose,
  defect,
  onReopen,
  title,
  isUpdateModal = false,
}: ReopenDefectModalProps) {
  const [isNewOccurrence, setIsNewOccurrence] = useState(false);
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<DefectAttachment[]>([]);
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
    if (!reason.trim()) {
      alert('Please provide a reason for reopening.');
      return;
    }

    try {
      await onReopen({
        isNewOccurrence,
        reason,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      
      // Reset form
      setIsNewOccurrence(false);
      setReason('');
      setAttachments([]);
      onClose();
    } catch (error: any) {
      alert(`Error reopening defect: ${error.message}`);
    }
  };

  const handleClose = () => {
    // Clean up blob URLs
    attachments.forEach(att => {
      if (att.uri.startsWith('blob:')) {
        URL.revokeObjectURL(att.uri);
      }
    });
    setIsNewOccurrence(false);
    setReason('');
    setAttachments([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title || "Reopen Defect"} size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {isUpdateModal
            ? 'Is this a NEW recurrence or the SAME ongoing defect?'
            : 'Is this a NEW occurrence or the EXISTING issue not fixed?'}
        </p>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="occurrenceType"
              checked={!isNewOccurrence}
              onChange={() => setIsNewOccurrence(false)}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-900">
                Existing issue (not fixed / incomplete repair)
              </div>
              <div className="text-sm text-gray-600">
                Reopens the same defect record, status changes to Open, logs reason
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="occurrenceType"
              checked={isNewOccurrence}
              onChange={() => setIsNewOccurrence(true)}
              className="w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-900">New occurrence</div>
              <div className="text-sm text-gray-600">
                Creates a NEW defect record linked to this one, increments recurrence count
              </div>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason / Notes <span className="text-red-600">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for reopening..."
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
              id="file-upload-reopen"
              className="hidden"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label
              htmlFor="file-upload-reopen"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                Click to upload or drag and drop
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

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || uploading}
          >
            {isNewOccurrence ? 'Create New Defect' : 'Reopen Defect'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

