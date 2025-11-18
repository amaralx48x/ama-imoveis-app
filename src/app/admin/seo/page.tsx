'use client';

import { useState, useEffect } from 'react';
import { saveSEOClient } from '@/firebase/seo'; 
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import ImageUpload from '@/components/image-upload';
import Image from 'next/image';

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
  const [isSaving, setIsSaving] = useState(false);
  
  const firestore = useFirestore();
  const seoRef = useMemoFirebase(() => firestore ? doc(firestore, "seo", "homepage") : null, [firestore]);
  const { data: seoData, isLoading, mutate } = useDoc<SeoData>(seoRef);

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

  const handleUploadComplete = (url: string) => {
    setSeo(prev => ({ ...prev, image: url }));
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await saveSEOClient('homepage', {
            title: seo.title,
            description: seo.description,
            keywords: seo.keywords.split(',').map(k => k.trim()).filter(Boolean),
            image: seo.image,
        });
        mutate();
        toast({ title: 'SEO salvo com sucesso!' });
    } catch(err) {
        console.error(err);
        toast({ title: 'Erro ao salvar SEO', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
              <Search /> Configurações de SEO (Página Principal)
            </CardTitle>
            <CardDescription>
                Gerencie como a página inicial de marketing aparece em mecanismos de busca como o Google.
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
                            placeholder="Ex: imóveis, comprar casa, apartamento, aluguel"
                        />
                         <p className="text-xs text-muted-foreground mt-1">Termos que descrevem seu negócio.</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Imagem de Compartilhamento (OG Image)</label>
                         <ImageUpload
                            onUploadComplete={handleUploadComplete}
                            currentImageUrl={seo.image}
                            agentId="admin"
                            propertyId="seo-homepage"
                         />
                         <p className="text-xs text-muted-foreground mt-1">A imagem que aparece ao compartilhar seu site em redes sociais. Tamanho recomendado: 1200x630px.</p>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar SEO'}
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
