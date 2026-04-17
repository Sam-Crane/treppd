'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react';

import { uploadDocument, type UserDocument } from '@/lib/documents-api';

const ACCEPT_MIME = 'application/pdf,image/jpeg,image/png,image/heic,image/heif';
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

type Status = 'idle' | 'uploading' | 'done' | 'error';

export function DocumentUploader({
  documentNameEn,
  stepSlug,
  onUploaded,
}: {
  documentNameEn: string;
  stepSlug?: string;
  onUploaded?: (doc: UserDocument) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ name: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE_BYTES) {
        setError('File is too large. Max 10 MB.');
        setStatus('error');
        return;
      }
      setError(null);
      setStatus('uploading');
      setProgress({ name: file.name });
      try {
        const doc = await uploadDocument(file, {
          document_name_en: documentNameEn,
          step_slug: stepSlug,
          display_name: file.name,
        });
        setStatus('done');
        onUploaded?.(doc);
        setTimeout(() => setStatus('idle'), 2500);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed.');
        setStatus('error');
      }
    },
    [documentNameEn, stepSlug, onUploaded],
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIME}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          // Allow uploading the same filename twice by resetting the value
          e.target.value = '';
        }}
      />

      <motion.div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={[
          'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs transition',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
            : 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700',
          status === 'done'
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
            : '',
          status === 'error'
            ? 'border-red-400 bg-red-50 dark:bg-red-950/40'
            : '',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          {status === 'uploading' ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : status === 'done' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : status === 'error' ? (
            <X className="h-4 w-4 text-red-600" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="font-medium">
            {status === 'uploading' && progress
              ? `Uploading ${progress.name}…`
              : status === 'done'
              ? 'Uploaded'
              : status === 'error'
              ? error ?? 'Upload failed'
              : 'Click or drop a file (PDF, JPG, PNG, HEIC, max 10 MB)'}
          </span>
        </div>
        {status === 'idle' && (
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Choose file
          </span>
        )}
      </motion.div>
    </div>
  );
}
