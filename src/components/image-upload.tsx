'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp, useUser } from '@/firebase';
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
  const { user } = useUser(); // Hook to get the authenticated user

  const handleUpload = async () => {
    if (!file) {
        toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "Usuário não autenticado", description: "Faça login para enviar imagens.", variant: "destructive"});
        return;
    }
    if (user.uid !== agentId) {
        toast({ title: "Permissão Negada", description: "Você não tem permissão para fazer upload para este perfil.", variant: "destructive"});
        return;
    }

    setLoading(true);
    
    try {
      const storage = getStorage(firebaseApp);

      // Path for profile picture (overwrite existing) or property picture (new file)
      const path = propertyId
        ? `agents/${agentId}/properties/${propertyId}/${Date.now()}_${file.name}`
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
      console.error("Firebase Storage Error:", err);
      toast({
        title: "Erro no Upload",
        description: err.code === 'storage/unauthorized' 
            ? 'Permissão negada. Verifique as regras de segurança do Storage.'
            : err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg max-w-sm bg-card/50">
      <Input 
        type="file" 
        accept="image/*" 
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className='file:text-primary file:font-semibold'
        disabled={loading}
       />
      <Button
        onClick={handleUpload}
        disabled={!file || loading || !user}
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? 'Enviando...' : 'Enviar Imagem'}
      </Button>
      {!user && <p className="text-xs text-destructive">Você precisa estar logado para fazer o upload.</p>}
    </div>
  );
}
