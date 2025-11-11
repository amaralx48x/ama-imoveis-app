
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp, useUser } from '@/firebase';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

type Props = {
  onUploadComplete?: (url: string) => void;
  onFileChange?: (file: File | null) => void;
  multiple?: boolean;
  currentImageUrl?: string | string[] | null;
  agentId: string;
  propertyId: string;
  id?: string;
};

export default function ImageUpload({ onUploadComplete, onFileChange, multiple, currentImageUrl, agentId, propertyId, id }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (onFileChange) {
        if (multiple) {
            setFiles(prev => [...prev, ...selectedFiles]);
            selectedFiles.forEach(file => onFileChange(file));
        } else {
            setFiles([selectedFiles[0]]);
            onFileChange(selectedFiles[0]);
        }
      } else {
        setFiles(prev => multiple ? [...prev, ...selectedFiles] : [selectedFiles[0]]);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
      return;
    }
    
    if (!agentId || !propertyId) {
        toast({ title: "Erro interno: IDs ausentes para upload", variant: "destructive"});
        console.error("agentId or propertyId is missing for ImageUpload", { agentId, propertyId });
        return;
    }

    setIsUploading(true);
    const storage = getStorage(firebaseApp);
    
    try {
      let basePath;
      if (propertyId === 'profile') {
          basePath = `agents/${agentId}/profile`;
      } else if (propertyId.startsWith('support-ticket-')) {
          basePath = `support-images/${agentId}`;
      } else if (agentId === 'marketing') {
          basePath = `marketing/${propertyId}`;
      } else if (propertyId.startsWith('upload-')) {
          basePath = `agents/${agentId}/links`;
      } else {
          basePath = `agents/${agentId}/properties/${propertyId}`;
      }

      const uploadPromises = files.map(async (file) => {
        const filePath = `${basePath}/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        if (onUploadComplete) {
            onUploadComplete(url);
        }
      });
      
      await Promise.all(uploadPromises);
      
      toast({ title: `Sucesso! ${files.length} imagem(ns) enviada(s).` });
      setFiles([]);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if(onFileChange && !multiple) {
        onFileChange(null);
    }
  };
  
  const displayImages = Array.isArray(currentImageUrl) ? currentImageUrl : (currentImageUrl ? [currentImageUrl] : []);
  const inputId = id || `file-upload-${propertyId}`;
  
  const hasOnFileSelected = !!onFileChange;

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Input 
          id={inputId}
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className='file:text-primary file:font-semibold'
          multiple={multiple}
        />
      </div>
      
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative text-xs bg-muted p-2 rounded-md flex items-center gap-2">
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-destructive"
              >
                <X className="w-3 h-3"/>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {!hasOnFileSelected && (
        <Button onClick={handleUpload} disabled={isUploading || files.length === 0} type="button">
            {isUploading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
            </>
            ) : (
            <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar {files.length > 0 ? files.length : ''} Imagem(ns)
            </>
            )}
        </Button>
      )}

      {displayImages.length > 0 && (
         <div className="mt-4 flex flex-wrap gap-4">
            {displayImages.map((url, index) => (
                <div key={index} className="relative w-32 h-32 rounded-md overflow-hidden border">
                    <Image src={url} alt={`Imagem atual ${index + 1}`} fill sizes="128px" className="object-cover" />
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
