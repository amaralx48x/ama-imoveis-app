'use client';

import { useState, useEffect } from 'react';
import { saveSEO } from '@/firebase/seo'; // Only saveSEO is needed on the client
import { useUser } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// This is a simplified client-side fetcher. In a real app, this would be an API route.
async function getSEOClient(page: string) {
  // This is a placeholder. In a real app, you would fetch from an API endpoint
  // that uses the server-side getSEO function.
  // For now, we will just let the user fill the form.
  return null;
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
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function SEOPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    image: '',
  });

  const seoKey = user ? `agent-${user.uid}` : null;

  useEffect(() => {
    if (!seoKey) return;
    setLoading(true);
    // In a real app, you would fetch initial data.
    // For now, we just enable the form for editing.
    // getSEOClient(seoKey).then(data => { ... });
    setLoading(false);
  }, [seoKey]);

  const handleSave = async () => {
    if (!seoKey) {
        toast({ title: 'Usuário não encontrado', variant: 'destructive'});
        return;
    }
    setIsSaving(true);
    try {
        await saveSEO(seoKey, {
            title: seo.title,
            description: seo.description,
            keywords: seo.keywords.split(',').map(k => k.trim()).filter(Boolean),
            image: seo.image,
        });
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
                <Search /> SEO da Página Pública
            </CardTitle>
            <CardDescription>
                Gerencie como seu site aparece em mecanismos de busca como o Google.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? <SEOPageSkeleton /> : (
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
                        <label className="text-sm font-medium">URL da Imagem de Compartilhamento (OG Image)</label>
                        <Input 
                            value={seo.image} 
                            onChange={e => setSeo({ ...seo, image: e.target.value })}
                            placeholder="https://.../sua-imagem.jpg"
                        />
                         <p className="text-xs text-muted-foreground mt-1">A imagem que aparece ao compartilhar seu site em redes sociais. Cole a URL de uma imagem já hospedada. Tamanho recomendado: 1200x630px.</p>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                        {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Configurações de SEO'}
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
