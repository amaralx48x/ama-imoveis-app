
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X } from 'lucide-react';

type Props = {
  onFileSelect: (files: File[]) => void;
  onUploadClick?: () => void;
  multiple?: boolean;
  isUploading?: boolean;
  id?: string;
  className?: string;
};

export default function ImageUpload({
  onFileSelect,
  onUploadClick,
  multiple,
  isUploading,
  id,
  className
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputId = id || `file-upload-${Math.random().toString(36).substring(7)}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(multiple ? [...selectedFiles, ...newFiles] : newFiles);
      onFileSelect(newFiles);
      // Reset input value to allow re-selecting the same file
      e.target.value = ''; 
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    // Note: We don't call onFileSelect here as it might be confusing.
    // The parent component manages the list of files to be uploaded.
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid gap-2">
        <Input
          id={inputId}
          type="file"
          accept="image/*,video/mp4,.ico"
          onChange={handleFileChange}
          className='file:text-primary file:font-semibold'
          multiple={multiple}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative text-xs bg-muted p-2 rounded-md flex items-center gap-2">
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-destructive"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {onUploadClick && (
        <Button onClick={onUploadClick} disabled={isUploading || selectedFiles.length === 0} type="button">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar {selectedFiles.length > 0 ? selectedFiles.length : ''} Arquivo(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
