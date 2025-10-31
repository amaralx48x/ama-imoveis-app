'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import { Badge } from './ui/badge';

type Props = {
  agentId: string;
  propertyId?: string; 
  onUploadComplete?: (urls: string[]) => void;
  multiple?: boolean;
};

const MAX_FILES = 20;

export default function ImageUpload({ agentId, propertyId, onUploadComplete, multiple = false }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length === 0) return;

    if (multiple && selectedFiles.length + files.length > MAX_FILES) {
      toast({
        title: `Limite de ${MAX_FILES} imagens excedido`,
        description: `Você só pode enviar até ${MAX_FILES} imagens no total.`,
        variant: 'destructive',
      });
      return;
    }

    setFiles(prev => multiple ? [...prev, ...selectedFiles] : [selectedFiles[0]]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleUpload = async () => {
    if (files.length === 0) {
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
      const uploadedUrls: string[] = [];

      for (const file of files) {
          const path = propertyId
            ? `agents/${agentId}/properties/${propertyId}/${Date.now()}_${file.name}`
            : `agents/${agentId}/profile.jpg`;

          const storageRef = ref(storage, path);
          const uploadResult = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(uploadResult.ref);
          uploadedUrls.push(url);
      }
      
      if (onUploadComplete) onUploadComplete(uploadedUrls);
      
      toast({
        title: "Upload Concluído!",
        description: `${uploadedUrls.length} imagem(s) enviada(s) com sucesso.`,
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
      setFiles([]);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card/50">
      <Input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className='file:text-primary file:font-semibold'
        disabled={loading}
        multiple={multiple}
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1 text-sm">
                    {file.name}
                    <button onClick={() => handleRemoveFile(index)} className="ml-2 rounded-full hover:bg-destructive/80 p-0.5" disabled={loading}>
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={files.length === 0 || loading || !user}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? `Enviando ${files.length} imagem(s)...` : `Enviar ${files.length} imagem(s)`}
      </Button>
      {!user && <p className="text-xs text-destructive text-center">Você precisa estar logado para fazer o upload.</p>}
    </div>
  );
}
