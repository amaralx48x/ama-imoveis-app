
'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveSEOClient } from '@/firebase/seo'; 
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUpload from '@/components/image-upload';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { InfoCard } from '@/components/info-card';

type SeoData = {
    title: string;
    description: string;
    keywords: string[];
    image: string;
}

function SEOPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-24 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function SEOPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const seoKey = user ? `agent-${user.uid}` : null;
  const seoRef = useMemoFirebase(() => (firestore && seoKey ? doc(firestore, "seo", seoKey) : null), [firestore, seoKey]);
  
  const { data: seoData, isLoading, mutate } = useDoc<SeoData>(seoRef);
  const [isSaving, setIsSaving] = useState(false);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    image: '',
  });

  useEffect(() => {
    if (seoData) {
      setSeo({
        title: seoData.title || '',
        description: seoData.description || '',
        keywords: (seoData.keywords || []).join(', '),
        image: seoData.image || '',
      });
    }
  }, [seoData]);

  const handleSave = useCallback(async () => {
    if (!seoKey || !user) {
        toast({ title: 'Usuário não encontrado', variant: 'destructive'});
        return;
    }
    setIsSaving(true);
    let imageUrl = seo.image;

    try {
        if (ogImageFile) {
            const storage = getStorage();
            const filePath = `agents/${user.uid}/site-assets/seo-og-image`;
            const fileRef = ref(storage, filePath);
            await uploadBytes(fileRef, ogImageFile);
            imageUrl = await getDownloadURL(fileRef);
        }

        await saveSEOClient(seoKey, {
            title: seo.title,
            description: seo.description,
            keywords: seo.keywords.split(',').map(k => k.trim()).filter(Boolean),
            image: imageUrl,
        });
        mutate();
        setOgImageFile(null);
        toast({ title: 'SEO salvo com sucesso!' });
    } catch(err) {
        console.error(err);
        toast({ title: 'Erro ao salvar SEO', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }, [seo, ogImageFile, seoKey, user, mutate, toast]);

  return (
    <div className="space-y-6">
        <InfoCard cardId="seo-info" title="Otimize sua Visibilidade (SEO)">
            <p>
                SEO (Search Engine Optimization) ajuda seu site a ser encontrado em mecanismos de busca como o Google. Preencha os campos abaixo para melhorar seu posicionamento.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Título:</strong> O nome que aparece na aba do navegador e como título principal no Google.</li>
                <li><strong>Descrição:</strong> O texto que aparece abaixo do título nos resultados da busca.</li>
                <li><strong>Palavras-chave:</strong> Termos que seus clientes usariam para te encontrar (ex: "imóveis em campinas", "casa para alugar").</li>
                <li><strong>Imagem de Compartilhamento:</strong> A imagem que aparece quando você ou alguém compartilha o link do seu site no WhatsApp ou redes sociais.</li>
            </ul>
        </InfoCard>

        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Search /> SEO da Página Pública
                </CardTitle>
                <CardDescription>
                    Gerencie como seu site aparece em mecanismos de busca como o Google.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <SEOPageSkeleton /> : (
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-medium">Título da Página</label>
                            <Input 
                                value={seo.title} 
                                onChange={e => setSeo({ ...seo, title: e.target.value })} 
                                placeholder="Ex: AMA Imóveis - Encontre seu lar"
                            />
                            <p className="text-xs text-muted-foreground mt-1">O título principal que aparece na aba do navegador e nos resultados de busca.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Descrição (Meta Description)</label>
                            <Textarea 
                                value={seo.description} 
                                onChange={e => setSeo({ ...seo, description: e.target.value })} 
                                placeholder="Descreva seu site em até 160 caracteres."
                                maxLength={160}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Este texto aparece abaixo do título nos resultados de busca.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Palavras-chave (separadas por vírgula)</label>
                            <Input 
                                value={seo.keywords} 
                                onChange={e => setSeo({ ...seo, keywords: e.target.value })}
                                placeholder="Ex: imóveis em sp, comprar casa, apartamento em campinas, aluguel"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Termos que descrevem seu negócio e localização.</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Imagem de Compartilhamento (OG Image)</label>
                            <ImageUpload onFileSelect={(files) => setOgImageFile(files[0])} />
                            <p className="text-xs text-muted-foreground mt-1">A imagem que aparece ao compartilhar seu site em redes sociais. Tamanho recomendado: 1200x630px.</p>
                        </div>

                        <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Configurações de SEO'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
