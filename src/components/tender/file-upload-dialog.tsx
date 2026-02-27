'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId?: string;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
  tenderId?: string;
}

export function FileUploadDialog({ open, onOpenChange, tenderId }: FileUploadDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.name.match(/\.(pdf|docx|zip|txt)$/i) && f.size <= 50 * 1024 * 1024
    );

    setFiles((prev) => [
      ...prev,
      ...droppedFiles.map((file) => ({
        file,
        status: 'pending' as const,
        progress: 0,
      })),
    ]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles((prev) => [
      ...prev,
      ...selected.map((file) => ({
        file,
        status: 'pending' as const,
        progress: 0,
      })),
    ]);
  }, []);

  const uploadFile = async (index: number) => {
    const uploadedFile = files[index];
    if (!uploadedFile || uploadedFile.status !== 'pending') return;

    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading', progress: 30 } : f))
    );

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      if (tenderId) formData.append('tenderId', tenderId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'success',
                progress: 100,
                message: `${data.extractedLength} tekens geëxtraheerd`,
                tenderId: data.tenderId,
              }
            : f
        )
      );
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: 'error', progress: 0, message: error.message }
            : f
        )
      );
    }
  };

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      await uploadFile(i);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const successFiles = files.filter((f) => f.status === 'success');
  const navigateToTender = () => {
    if (successFiles.length > 0 && successFiles[0].tenderId) {
      router.push(`/tenders/${successFiles[0].tenderId}`);
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Documenten uploaden</h2>
          <button
            onClick={() => {
              onOpenChange(false);
              setFiles([]);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          )}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">
            Sleep bestanden hierheen of klik om te selecteren
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, ZIP of TXT (max 50MB)
          </p>
          <input
            type="file"
            accept=".pdf,.docx,.zip,.txt"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ position: 'relative', marginTop: '8px' }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((f, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  {f.status === 'uploading' && (
                    <Progress value={f.progress} className="mt-1 h-1" />
                  )}
                  {f.message && (
                    <p
                      className={cn(
                        'text-xs mt-0.5',
                        f.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {f.message}
                    </p>
                  )}
                </div>
                {f.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {f.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                {f.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {f.status === 'pending' && (
                  <button onClick={() => removeFile(index)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          {successFiles.length > 0 && (
            <Button onClick={navigateToTender}>
              Ga naar tender
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {files.some((f) => f.status === 'pending') && (
            <Button onClick={uploadAll}>
              <Upload className="h-4 w-4 mr-2" />
              Upload {files.filter((f) => f.status === 'pending').length} bestanden
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
