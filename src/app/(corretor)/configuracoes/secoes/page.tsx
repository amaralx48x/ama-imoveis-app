
'use client';
import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import type { CustomSection, Agent } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Folder, Plus, Trash2, Edit, Check, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


function SettingToggle({ 
    id, 
    label, 
    description, 
    isChecked, 
    onCheckedChange, 
    isLoading,
}: { 
    id: string, 
    label: string, 
    description: string, 
    isChecked: boolean, 
    onCheckedChange: (checked: boolean) => void, 
    isLoading: boolean,
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
            </div>
        )
    }
    
    return (
        <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor={id} className="text-base font-medium">{label}</Label>
                    <p id={`${id}-description`} className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                <Switch
                    id={id}
                    checked={isChecked}
                    onCheckedChange={onCheckedChange}
                    aria-describedby={`${id}-description`}
                />
            </div>
        </div>
    )
}

export default function GerenciarSecoesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const sectionsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `agents/${user.uid}/customSections`) : null),
        [user, firestore]
    );

    const { data: sections, isLoading, error, mutate: mutateSections } = useCollection<CustomSection>(sectionsCollection);
    
    const agentRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
        [user, firestore]
    );

    const { data: agentData, isLoading: isAgentLoading, mutate: mutateAgent } = useDoc<Agent>(agentRef);

    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);

    const handleSettingChange = (key: string) => (value: boolean | string) => {
        if (!agentRef) return;
        
        const updatePath = `siteSettings.${key}`;
        updateDocumentNonBlocking(agentRef, { [updatePath]: value });
        mutateAgent(); // Re-fetch the data to update UI

        toast({
            title: "Configuração atualizada!",
            description: "A mudança será refletida no seu site público."
        });
    };

    const handleCreateSection = async () => {
        if (!newSectionTitle.trim() || !user || !firestore) return;

        const newSection: Omit<CustomSection, 'id'> = {
            title: newSectionTitle,
            order: (sections?.length || 0) + 1,
            createdAt: serverTimestamp(),
        };
        const sectionId = uuidv4();
        const docRef = doc(firestore, `agents/${user.uid}/customSections`, sectionId);
        
        try {
            await setDoc(docRef, { ...newSection, id: sectionId });
            
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

    const siteSettings = agentData?.siteSettings;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Folder /> Gerenciar Seções do Site
                </CardTitle>
                <CardDescription>
                    Crie e organize seções personalizadas de imóveis e controle a visibilidade de outras áreas do seu site.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Nova Seção Personalizada</h3>
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

                <Separator />
                
                <div>
                    <h3 className="text-lg font-semibold mb-4">Outras Seções da Página</h3>
                    <div className="space-y-4">
                        <SettingToggle
                            id="showReviews"
                            label="Seção de Avaliações de Clientes"
                            description="Mostra o carrossel com as avaliações e depoimentos dos seus clientes."
                            isChecked={siteSettings?.showReviews ?? true}
                            onCheckedChange={handleSettingChange('showReviews')}
                            isLoading={isAgentLoading}
                        />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
