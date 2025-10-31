
'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Property, CustomSection } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function AssociatePropertyContent() {
    const searchParams = useSearchParams();
    const propertyId = searchParams.get('propertyId');

    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch the property being associated
    const propertyRef = useMemoFirebase(
        () => (user && firestore && propertyId ? doc(firestore, `agents/${user.uid}/properties`, propertyId) : null),
        [user, firestore, propertyId]
    );
    const { data: property, isLoading: isPropertyLoading } = useDoc<Property>(propertyRef);

    // Fetch all custom sections for the agent
    const sectionsCollection = useMemoFirebase(
        () => (user && firestore ? collection(firestore, `agents/${user.uid}/customSections`) : null),
        [user, firestore]
    );
    const { data: sections, isLoading: areSectionsLoading } = useCollection<CustomSection>(sectionsCollection);

    const handleSectionToggle = async (sectionId: string, isChecked: boolean) => {
        if (!firestore || !user || !propertyId) return;

        const sectionRef = doc(firestore, `agents/${user.uid}/customSections`, sectionId);
        
        try {
            await updateDoc(sectionRef, {
                propertyIds: isChecked ? arrayUnion(propertyId) : arrayRemove(propertyId)
            });
            toast({
                title: "Associação atualizada!",
                description: `O imóvel foi ${isChecked ? 'adicionado à' : 'removido da'} seção.`,
            });
        } catch (error) {
            console.error("Failed to update section association:", error);
            toast({
                title: "Erro ao atualizar",
                variant: 'destructive'
            });
        }
    };

    if (isPropertyLoading || areSectionsLoading) {
        return <Skeleton className="w-full h-64" />;
    }
    
    if (!property) {
        return <p>Imóvel não encontrado.</p>;
    }

    return (
        <div className="space-y-4">
            <Button variant="outline" asChild>
                <Link href="/imoveis">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Meus Imóveis
                </Link>
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Link2 /> Associar Imóvel a Seções
                    </CardTitle>
                    <CardDescription>
                        Marque as seções em que o imóvel <span className="font-semibold text-primary">{property.title}</span> deve aparecer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {sections && sections.length > 0 ? (
                        sections.map(section => {
                            const isAssociated = section.propertyIds.includes(property.id);
                            return (
                                <div key={section.id} className="flex items-center space-x-3 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <Checkbox
                                        id={`section-${section.id}`}
                                        checked={isAssociated}
                                        onCheckedChange={(checked) => handleSectionToggle(section.id, !!checked)}
                                    />
                                    <Label htmlFor={`section-${section.id}`} className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        {section.title}
                                    </Label>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-md">
                            <p>Nenhuma seção personalizada foi criada ainda.</p>
                            <Button variant="link" asChild><Link href="/configuracoes/secoes">Criar minha primeira seção</Link></Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function AssociarPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <AssociatePropertyContent />
        </Suspense>
    );
}

