'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

type Props = {
  agentId: string;
  propertyId?: string; 
  onUploadComplete?: (url: string) => void;
};

export default function ImageUpload({ agentId, propertyId, onUploadComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    
    try {
      const storage = getStorage(firebaseApp);

      const path = propertyId
        ? `agents/${agentId}/properties/${propertyId}/${file.name}`
        : `agents/${agentId}/profile.jpg`;

      const storageRef = ref(storage, path);
      const uploadResult = await uploadBytes(storageRef, file);

      const url = await getDownloadURL(uploadResult.ref);
      
      if (onUploadComplete) onUploadComplete(url);
      
      toast({
        title: "Upload Concluído",
        description: "Sua imagem foi enviada com sucesso.",
      });

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro no Upload",
        description: err.message || 'Não foi possível enviar a imagem. Verifique as permissões do Firebase Storage.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg max-w-sm">
      <Input 
        type="file" 
        accept="image/*" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className='file:text-primary file:font-semibold'
        disabled={loading}
       />
      <Button
        onClick={handleUpload}
        disabled={!file || loading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? 'Enviando...' : 'Enviar Imagem'}
      </Button>
    </div>
  );
}
