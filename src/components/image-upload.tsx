
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

type Props = {
  onUploadComplete: (url: string) => void;
  multiple?: boolean;
  currentImageUrl?: string | string[] | null;
  agentId: string;
  propertyId: string;
};

export default function ImageUpload({ onUploadComplete, multiple, currentImageUrl, agentId, propertyId }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => multiple ? [...prev, ...selectedFiles] : [selectedFiles[0]]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
      return;
    }
    
    setIsUploading(true);
    const storage = getStorage(firebaseApp);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const filePath = `agents/${agentId}/properties/${propertyId}/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        onUploadComplete(url);
      });
      
      await Promise.all(uploadPromises);
      
      toast({ title: `Sucesso! ${files.length} imagem(ns) enviada(s).` });
      setFiles([]); // Clear selection after successful upload
    } catch (err) {
      console.error(err);
      toast({ title: "Erro no upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid gap-2">
        <label htmlFor="file-upload" className="font-medium text-sm">Selecione as imagens</label>
        <Input 
          id="file-upload"
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
    </div>
  );
}
