
'use client';
import { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { CustomSection } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Folder, Plus, Trash2, Edit, Check, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function GerenciarSecoesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const sectionsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `agents/${user.uid}/customSections`) : null),
        [user, firestore]
    );

    const { data: sections, isLoading, error } = useCollection<CustomSection>(sectionsCollection);

    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);

    const handleCreateSection = async () => {
        if (!newSectionTitle.trim() || !user || !firestore) return;

        const newSection: Omit<CustomSection, 'id'> = {
            title: newSectionTitle,
            propertyIds: [],
            order: (sections?.length || 0) + 1,
            createdAt: serverTimestamp(),
        };
        const sectionId = uuidv4();
        const docRef = doc(firestore, `agents/${user.uid}/customSections`, sectionId);
        
        try {
            const batch = writeBatch(firestore);
            batch.set(docRef, { ...newSection, id: sectionId });
            await batch.commit();
            
            toast({ title: 'Seção criada!', description: `A seção "${newSectionTitle}" foi adicionada.` });
            setNewSectionTitle('');
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro ao criar seção', variant: 'destructive' });
        }
    };

    const handleUpdateSection = async () => {
        if (!editingSection || !editingSection.title.trim() || !user || !firestore) return;

        const docRef = doc(firestore, `agents/${user.uid}/customSections`, editingSection.id);
        
        try {
             const batch = writeBatch(firestore);
             batch.update(docRef, { title: editingSection.title });
             await batch.commit();

             toast({ title: 'Seção atualizada!', description: 'O título da seção foi alterado.' });
             setEditingSection(null);
        } catch (err) {
             console.error(err);
             toast({ title: 'Erro ao atualizar seção', variant: 'destructive' });
        }
    };
    
    const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
        if (!user || !firestore || !window.confirm(`Tem certeza que deseja excluir a seção "${sectionTitle}"?`)) return;

        const docRef = doc(firestore, `agents/${user.uid}/customSections`, sectionId);

        try {
            const batch = writeBatch(firestore);
            batch.delete(docRef);
            await batch.commit();
            toast({ title: 'Seção excluída com sucesso!' });
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro ao excluir seção', variant: 'destructive' });
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Folder /> Gerenciar Seções do Site
                </CardTitle>
                <CardDescription>
                    Crie e organize seções personalizadas de imóveis para exibir na sua página inicial.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Nova Seção</h3>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ex: Oportunidades no Centro"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                        />
                        <Button onClick={handleCreateSection} disabled={!newSectionTitle.trim()}>
                            <Plus className="mr-2 h-4 w-4" /> Criar
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                     <h3 className="text-lg font-semibold">Minhas Seções</h3>
                    {isLoading && (
                        <div className="space-y-3">
                            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                        </div>
                    )}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>Não foi possível carregar as seções.</AlertDescription>
                        </Alert>
                    )}
                    {!isLoading && !error && sections?.length === 0 && (
                        <p className="text-muted-foreground text-sm">Nenhuma seção personalizada criada ainda.</p>
                    )}
                    {!isLoading && sections && (
                        <div className="space-y-2">
                            {sections.map(section => (
                                <div key={section.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    {editingSection?.id === section.id ? (
                                        <Input 
                                            value={editingSection.title}
                                            onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
                                            className="h-9"
                                        />
                                    ) : (
                                        <span className="font-medium">{section.title}</span>
                                    )}

                                    <div className="flex gap-2">
                                        {editingSection?.id === section.id ? (
                                             <>
                                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={handleUpdateSection}><Check className="h-4 w-4 text-green-500"/></Button>
                                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setEditingSection(null)}><X className="h-4 w-4"/></Button>
                                             </>
                                        ) : (
                                            <>
                                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setEditingSection({id: section.id, title: section.title})}><Edit className="h-4 w-4" /></Button>
                                                <Button size="icon" variant="destructive" className="h-9 w-9" onClick={() => handleDeleteSection(section.id, section.title)}><Trash2 className="h-4 w-4" /></Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
