import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { showToast } from '../../../components/common/Toast';

export interface EvidenceFile {
  id: string;
  file: File;
  preview: string;
  caption?: string;
  location?: string;
  linkedTaskId?: string;
}

interface EvidenceUploaderProps {
  files: EvidenceFile[];
  onFilesChange: (files: EvidenceFile[]) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  accept?: string;
}

// Supported image MIME types
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Reusable component for uploading evidence photos with drag-and-drop support
 */
export function EvidenceUploader({
  files,
  onFilesChange,
  maxFiles = MAX_FILES,
  maxFileSizeMB = MAX_FILE_SIZE_MB,
  accept = 'image/*',
}: EvidenceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Cleanup object URLs on unmount only
  useEffect(() => {
    return () => {
      // Only clean up on component unmount
      // Individual file cleanup is handled in handleRemoveFile
    };
  }, []);

  /**
   * Check if file is a duplicate based on name, size, and lastModified
   */
  const isDuplicate = useCallback(
    (file: File): boolean => {
      return files.some(
        (existing) =>
          existing.file.name === file.name &&
          existing.file.size === file.size &&
          existing.file.lastModified === file.lastModified
      );
    },
    [files]
  );

  /**
   * Validate a single file
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!file.type.startsWith('image/') && !IMAGE_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: `"${file.name}" is not a supported image format. Please use JPG, PNG, WebP, or HEIC.`,
        };
      }

      // Check file size
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        return {
          valid: false,
          error: `"${file.name}" exceeds the maximum file size of ${maxFileSizeMB}MB.`,
        };
      }

      // Check for duplicates
      if (isDuplicate(file)) {
        return {
          valid: false,
          error: `"${file.name}" has already been added.`,
        };
      }

      return { valid: true };
    },
    [maxFileSizeMB, isDuplicate]
  );

  /**
   * Process and add files to the list
   */
  const processFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Check if adding these files would exceed the limit
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) {
        showToast(`Maximum ${maxFiles} files allowed. Please remove some files first.`, 'error');
        return;
      }

      // Process each file
      for (let i = 0; i < Math.min(newFiles.length, remainingSlots); i++) {
        const file = newFiles[i];
        const validation = validateFile(file);

        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(validation.error || 'Unknown error');
        }
      }

      // Show errors if any
      if (errors.length > 0) {
        errors.forEach((error) => showToast(error, 'error'));
      }

      // If we hit the limit, show a message
      if (newFiles.length > remainingSlots) {
        showToast(
          `Only ${remainingSlots} file${remainingSlots === 1 ? '' : 's'} added. Maximum ${maxFiles} files allowed.`,
          'warning'
        );
      }

      // Create preview URLs and add to list
      const newEvidenceFiles: EvidenceFile[] = validFiles.map((file) => {
        const preview = URL.createObjectURL(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview,
        };
      });

      if (newEvidenceFiles.length > 0) {
        onFilesChange([...files, ...newEvidenceFiles]);
      }
    },
    [files, maxFiles, validateFile, onFilesChange]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(Array.from(selectedFiles));
      }
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the dropzone itself
    if (!dropzoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [processFiles]
  );

  /**
   * Remove a file from the list
   */
  const handleRemoveFile = useCallback(
    (id: string) => {
      const fileToRemove = files.find((f) => f.id === id);
      if (fileToRemove && fileToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  /**
   * Update file metadata (caption, location, etc.)
   */
  const handleUpdateFile = useCallback(
    (id: string, field: 'caption' | 'location' | 'linkedTaskId', value: string) => {
      const updated = files.map((f) => (f.id === id ? { ...f, [field]: value } : f));
      onFilesChange(updated);
    },
    [files, onFilesChange]
  );

  /**
   * Open file picker
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        ref={dropzoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <ImageIcon className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <div>
            <p className="text-sm font-medium text-gray-900">Drag & drop photos here</p>
            <p className="text-xs text-gray-500 mt-1">or click Upload Photos</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="mt-2"
            type="button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
          <p className="text-xs text-gray-400 mt-2">
            Maximum {maxFiles} files, {maxFileSizeMB}MB per file
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* File count indicator */}
      {files.length > 0 && (
        <p className="text-sm text-gray-600">
          {files.length} file{files.length === 1 ? '' : 's'} selected
        </p>
      )}
    </div>
  );
}

