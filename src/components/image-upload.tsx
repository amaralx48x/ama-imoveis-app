
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useFirebaseApp, useUser, storage, useFirestore } from '@/firebase';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { usePlan } from '@/context/PlanContext';

type Props = {
  onUploadComplete?: (url: string) => void;
  onFileChange?: (file: File | null) => void;
  multiple?: boolean;
  currentImageUrl?: string | string[] | null;
  agentId: string;
  propertyId: string;
  id?: string;
  disabled?: boolean;
};

export default function ImageUpload({ 
    onUploadComplete, 
    onFileChange, 
    multiple, 
    currentImageUrl, 
    agentId, 
    propertyId, 
    id,
    disabled = false,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

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
    
    if (!agentId || !propertyId || !firestore) {
        toast({ title: "Erro interno: IDs ausentes para upload", variant: "destructive"});
        return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        let basePath;
        let fileName;
        const fileExtension = file.name.split('.').pop() || 'jpg';

        if (propertyId === 'profile' || propertyId === 'favicon') {
            basePath = `agents/${agentId}/site-assets`;
            fileName = `${propertyId}.${fileExtension}`;
        } else if (propertyId.startsWith('support-ticket-')) {
            basePath = `support-images/${agentId}`;
            fileName = `${Date.now()}_${uuidv4()}.${fileExtension}`;
        } else if (agentId === 'marketing') {
            basePath = `marketing`;
            fileName = `${propertyId}.${fileExtension}`;
        } else if (propertyId.startsWith('upload-')) {
            basePath = `agents/${agentId}/links`;
            const linkId = propertyId.replace('upload-', '');
            fileName = `${linkId}.${fileExtension}`;
        } else if (propertyId === 'seo-homepage' && agentId === 'admin') {
            basePath = `seo/assets`;
            fileName = `homepage-og-image.${fileExtension}`;
        } else if (propertyId === 'seo-image') {
             basePath = `agents/${agentId}/site-assets`;
             fileName = `seo-og-image.${fileExtension}`;
        } else {
            basePath = `agents/${agentId}/properties/${propertyId}`;
            fileName = `${Date.now()}_${uuidv4()}.${fileExtension}`;
        }

        const filePath = `${basePath}/${fileName}`;
        const fileRef = ref(storage, filePath);
        const uploadResult = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        
        if (onUploadComplete) {
            onUploadComplete(url);
        }

        // Increment simulated storage usage if not admin/marketing
        if (agentId !== 'admin' && agentId !== 'marketing') {
            const agentRef = doc(firestore, 'agents', agentId);
            const simulatedSize = 0.8 * 1024 * 1024 + Math.random() * (20 - 0.8) * 1024 * 1024; // 800KB to 20MB in bytes
            await updateDoc(agentRef, {
                simulatedStorageUsed: increment(simulatedSize)
            });
        }
      });
      
      await Promise.all(uploadPromises);
      
      toast({ title: `Sucesso! ${files.length} arquivo(s) enviado(s).` });
      setFiles([]);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro no upload", description: "Verifique as permissões de CORS e Storage.", variant: "destructive" });
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
          accept="image/*,video/mp4,.ico"
          onChange={handleFileChange}
          className='file:text-primary file:font-semibold'
          multiple={multiple}
          disabled={disabled || isUploading}
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
        <Button onClick={handleUpload} disabled={disabled || isUploading || files.length === 0} type="button">
            {isUploading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
            </>
            ) : (
            <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar {files.length > 0 ? files.length : ''} Arquivo(s)
            </>
            )}
        </Button>
      )}

      {displayImages.length > 0 && (
         <div className="mt-4 flex flex-wrap gap-4">
            {displayImages.map((url, index) => (
                <div key={index} className="relative w-32 h-32 rounded-md overflow-hidden border">
                    {url.includes('.mp4') ? (
                       <video src={url} className="object-cover w-full h-full" muted loop autoPlay playsInline />
                    ) : (
                       <Image src={url} alt={`Imagem atual ${index + 1}`} fill sizes="128px" className="object-cover" />
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
