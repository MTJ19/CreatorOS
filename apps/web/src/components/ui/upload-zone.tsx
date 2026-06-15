/* eslint-disable */
import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  loadingText?: string;
  error?: string | null;
  className?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  isLoading = false,
  loadingText = 'Uploading and processing file...',
  error = null,
  className,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError('File size exceeds the 10MB limit.');
      return;
    }

    // Validate type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    // Some browsers have empty file.type for docx, so we also check extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isDoc = ['docx', 'doc', 'pdf'].includes(extension || '');

    if (!allowedTypes.includes(file.type) && !isDoc) {
      setValidationError('Unsupported file format. Please upload a PDF or Word document (.doc, .docx).');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const activeError = error || validationError;

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        disabled={isLoading}
      />

      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={isLoading ? undefined : onButtonClick}
        animate={{
          scale: isDragActive ? 0.99 : 1,
          borderColor: isDragActive ? '#a855f7' : activeError ? '#ef4444' : '#3f3f46',
          backgroundColor: isDragActive ? 'rgba(168, 85, 247, 0.05)' : 'rgba(24, 24, 27, 0.4)',
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 backdrop-blur-md',
          isLoading && 'cursor-not-allowed opacity-80',
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center space-y-4"
            >
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-zinc-300 text-sm font-medium">{loadingText}</p>
              <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '90%' }}
                  transition={{ duration: 8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                />
              </div>
            </motion.div>
          ) : selectedFile && !activeError ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center space-y-3"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <div className="text-center">
                <p className="text-zinc-100 font-medium text-sm max-w-md truncate mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-zinc-400 text-xs mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                </p>
              </div>
              <p className="text-purple-400 text-xs hover:text-purple-300 font-semibold underline mt-2">
                Click or drag to replace file
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center space-y-4"
            >
              <div className="p-4 bg-zinc-800/60 rounded-full text-zinc-400 group-hover:text-purple-400 transition-colors">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-zinc-200 font-semibold text-sm">
                  Drag & drop file here, or <span className="text-purple-400">browse</span>
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  Supports PDF, DOCX or DOC (Max 10MB)
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 text-red-400 text-xs font-medium bg-red-950/20 py-1.5 px-3 rounded-lg border border-red-500/20"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{activeError}</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
