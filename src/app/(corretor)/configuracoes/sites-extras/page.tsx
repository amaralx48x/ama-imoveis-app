
'use client';
import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import type { CatalogPage } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Trash2, Edit, AlertTriangle, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoCard } from '@/components/info-card';
import { useRouter } from 'next/navigation';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normaliza para decompor acentos
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/[^\w-]+/g, '') // Remove caracteres não-alfanuméricos (exceto -)
    .replace(/--+/g, '-'); // Substitui múltiplos - por um único -
}

export default function GerenciarSitesExtrasPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const catalogCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `agents/${user.uid}/catalogPages`) : null),
        [user, firestore]
    );

    const { data: catalogPages, isLoading, error, mutate } = useCollection<CatalogPage>(catalogCollection);
    
    const [newPageName, setNewPageName] = useState('');

    const handleCreatePage = async () => {
        if (!newPageName.trim() || !user || !firestore) return;

        const newPage: Omit<CatalogPage, 'id'> = {
            name: newPageName,
            slug: slugify(newPageName),
            createdAt: serverTimestamp(),
        };
        const pageId = uuidv4();
        const docRef = doc(firestore, `agents/${user.uid}/catalogPages`, pageId);
        
        try {
            await setDoc(docRef, { ...newPage, id: pageId });
            mutate();
            toast({ title: 'Página criada!', description: `A página "${newPageName}" foi adicionada. Você será redirecionado para editá-la.` });
            setNewPageName('');
            router.push(`/configuracoes/sites-extras/editar/${pageId}`);
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro ao criar página', variant: 'destructive' });
        }
    };

    const handleDeletePage = async (pageId: string, pageName: string) => {
        if (!user || !firestore || !window.confirm(`Tem certeza que deseja excluir a página "${pageName}"?`)) return;

        const docRef = doc(firestore, `agents/${user.uid}/catalogPages`, pageId);

        try {
            await deleteDoc(docRef);
            mutate();
            toast({ title: 'Página excluída com sucesso!' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro ao excluir página', variant: 'destructive' });
        }
    };
    
    const handleEditPage = (pageId: string) => {
        router.push(`/configuracoes/sites-extras/editar/${pageId}`);
    };

    return (
        <div className="space-y-6">
            <InfoCard cardId="sites-extras-info" title="Crie Landing Pages para seus Empreendimentos">
                <p>
                    "Sites Extras" são páginas de aterrissagem (landing pages) independentes, focadas na conversão para um único imóvel ou empreendimento. Use-as como o destino para suas campanhas de marketing, links no Instagram ou QR codes.
                </p>
                <p>
                    Crie uma nova página aqui, dê um nome para ela (ex: "Lançamento Residencial Sol Nascente") e, em seguida, edite todo o seu conteúdo, como fotos, textos e diferenciais.
                </p>
            </InfoCard>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Layers /> Gerenciar Sites Extras
                    </CardTitle>
                    <CardDescription>
                        Crie e gerencie páginas de catálogo dedicadas para seus principais imóveis ou empreendimentos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Nova Página de Catálogo</h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ex: Lançamento AlphaVille"
                                value={newPageName}
                                onChange={(e) => setNewPageName(e.target.value)}
                            />
                            <Button onClick={handleCreatePage} disabled={!newPageName.trim()}>
                                <Plus className="mr-2 h-4 w-4" /> Criar Página
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Minhas Páginas</h3>
                        {isLoading && (
                            <div className="space-y-3">
                                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>Não foi possível carregar as páginas.</AlertDescription>
                            </Alert>
                        )}
                        {!isLoading && !error && catalogPages?.length === 0 && (
                            <p className="text-muted-foreground text-sm text-center border-dashed border-2 p-8">Nenhuma página criada ainda.</p>
                        )}
                        {!isLoading && catalogPages && (
                            <div className="space-y-2">
                                {catalogPages.map(page => (
                                    <div key={page.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{page.name}</span>
                                            <a 
                                                href={`/catalog/${page.slug}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                            >
                                                <Globe className="h-3 w-3" />
                                                /catalog/{page.slug}
                                            </a>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => handleEditPage(page.id)}><Edit className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleDeletePage(page.id, page.name)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
