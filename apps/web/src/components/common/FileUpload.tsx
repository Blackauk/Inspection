import { useState, useRef } from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { Button } from './Button';

export interface UploadedFile {
  id: string;
  file: File;
  type: 'photo' | 'document';
  preview?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  label?: string;
}

export function FileUpload({
  files,
  onFilesChange,
  accept = 'image/*,.pdf,.doc,.docx,.xlsx',
  maxFiles,
  label = 'Attachments',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getFileType = (file: File): 'photo' | 'document' => {
    if (file.type.startsWith('image/')) {
      return 'photo';
    }
    return 'document';
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    Array.from(selectedFiles).forEach((file) => {
      if (maxFiles && files.length + newFiles.length >= maxFiles) {
        return;
      }

      const fileType = getFileType(file);
      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: fileType,
      };

      // Create preview for images
      if (fileType === 'photo') {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          onFilesChange([...files, ...newFiles, uploadedFile]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(uploadedFile);
      }
    });

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleRemove = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (file: UploadedFile) => {
    if (file.type === 'photo') {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag & drop files here or
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="inline-block">
            <Button variant="outline" size="sm" onClick={(e) => e.preventDefault()}>
              Browse Files
            </Button>
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Photos (JPG, PNG) • Documents (PDF, DOC, DOCX, XLSX)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {uploadedFile.type === 'photo' && uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt={uploadedFile.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  {getFileIcon(uploadedFile)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.file.size / 1024).toFixed(2)} KB •{' '}
                  {uploadedFile.type === 'photo' ? 'Photo' : 'Document'}
                </p>
              </div>
              <button
                onClick={() => handleRemove(uploadedFile.id)}
                className="p-1 rounded hover:bg-gray-200 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
