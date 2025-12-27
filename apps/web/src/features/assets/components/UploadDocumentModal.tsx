import { useState, useRef } from 'react';
import { Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { showToast } from '../../../components/common/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import type { AssetDocument } from '../services/assetDemoData';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  onUpload: (document: AssetDocument) => void;
}

export function UploadDocumentModal({
  isOpen,
  onClose,
  assetId,
  onUpload,
}: UploadDocumentModalProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        showToast('Invalid file type. Please select an image or PDF/document', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please select a file', 'error');
      return;
    }

    setUploading(true);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create document object
    const document: AssetDocument = {
      id: `doc-${Date.now()}`,
      filename: selectedFile.name,
      type: selectedFile.type.startsWith('image/') ? 'photo' : 'document',
      uploadedAt: new Date().toISOString(),
      uploadedBy: user ? `${user.firstName} ${user.lastName}`.trim() || user.email || 'Current User' : 'Current User',
    };

    onUpload(document);
    setUploading(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast(`File "${selectedFile.name}" uploaded successfully`, 'success');
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    if (selectedFile.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-600" />;
    }
    return <FileText className="w-8 h-8 text-blue-600" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Photo / Document"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  {getFileIcon()}
                  <p className="mt-2 text-sm text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF, PDF, DOC, DOCX up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>
          {selectedFile && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              Change File
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

