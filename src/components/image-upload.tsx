'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { Badge } from './ui/badge';
import Image from 'next/image';

type Props = {
  onFileChange: (file: File | null) => void;
  multiple?: boolean;
  currentImageUrl?: string | null;
  label?: string;
  id?: string;
};

export default function ImageUpload({ onFileChange, currentImageUrl, label, id }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    onFileChange(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
        setPreview(currentImageUrl || null);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
    onFileChange(null);
    setPreview(currentImageUrl || null);
    // Reset the input value
    const input = document.getElementById(id || 'file-upload') as HTMLInputElement;
    if (input) input.value = '';
  }

  return (
    <div className="flex flex-col gap-4">
      {preview && (
        <div className="relative w-32 h-32 rounded-md overflow-hidden self-center">
            <Image src={preview} alt="Pré-visualização" layout="fill" objectFit="cover" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input 
          id={id || 'file-upload'}
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className='file:text-primary file:font-semibold flex-grow'
        />
        {file && (
          <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
            <X className="w-4 h-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
