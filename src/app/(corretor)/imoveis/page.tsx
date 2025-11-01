
'use client';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { PropertyCard } from '@/components/property-card';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/data';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function PropertyList({ 
    properties, 
    isLoading, 
    error,
    onDelete, 
    onStatusChange,
    emptyStateTitle,
    emptyStateDescription,
}: {
    properties: Property[] | null,
    isLoading: boolean,
    error: Error | null,
    onDelete: (id: string) => void,
    onStatusChange: () => void,
    emptyStateTitle: string,
    emptyStateDescription: string,
}) {
     if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[224px] w-full rounded-xl" />
                    <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao Carregar Imóveis</AlertTitle>
                <AlertDescription>
                    Não foi possível buscar seus imóveis no momento. Verifique sua conexão ou tente novamente mais tarde.
                </AlertDescription>
            </Alert>
        )
    }

    if (properties && properties.length === 0) {
        return (
            <div className="text-center py-16 rounded-lg border-2 border-dashed mt-6">
                <h2 className="text-2xl font-bold mb-2">{emptyStateTitle}</h2>
                <p className="text-muted-foreground mb-4">{emptyStateDescription}</p>
                 {emptyStateTitle.includes("Nenhum imóvel ativo") && (
                     <Button asChild>
                        <Link href="/imoveis/novo">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Primeiro Imóvel
                        </Link>
                    </Button>
                 )}
            </div>
        )
    }

    return (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
            {properties && properties.map((property) => (
                <PropertyCard key={property.id} property={property} onDelete={onDelete} onStatusChange={onStatusChange} />
            ))}
        </div>
    )
}

export default function ImoveisPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'ativo' | 'vendido' | 'alugado'>('ativo');

    const propertiesCollection = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, `agents/${user.uid}/properties`);
    }, [firestore, user]);

    const propertiesQuery = useMemoFirebase(() => {
        if (!propertiesCollection) return null;
        if (activeTab === 'ativo') {
            // Firestore does not have a "not equal" query directly.
            // The logic to get documents where 'status' is 'ativo' OR does not exist
            // is to query for everything that is NOT 'vendido' and NOT 'alugado'.
            // This requires a "not-in" query.
             return query(propertiesCollection, where('status', 'not-in', ['vendido', 'alugado']));
        }
        return query(propertiesCollection, where('status', '==', activeTab));
    }, [propertiesCollection, activeTab]);

    const { data: properties, isLoading, error, mutate } = useCollection<Property>(propertiesQuery);
    
    const handleDeleteProperty = (id: string) => {
        if (!firestore || !user) return;
        const docRef = doc(firestore, `agents/${user.uid}/properties`, id);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Imóvel excluído com sucesso!' });
        mutate();
    };
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Meus Imóveis</h1>
                    <p className="text-muted-foreground">Gerencie seu portfólio de imóveis.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                         <Link href="/imoveis/importar">
                            <Upload className="mr-2 h-4 w-4" />
                            Importar CSV
                        </Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                        <Link href="/imoveis/novo">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Imóvel
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="ativo">Ativos</TabsTrigger>
                    <TabsTrigger value="vendido">Vendidos</TabsTrigger>
                    <TabsTrigger value="alugado">Alugados</TabsTrigger>
                </TabsList>
                <TabsContent value="ativo">
                    <PropertyList 
                        properties={properties}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleDeleteProperty}
                        onStatusChange={mutate}
                        emptyStateTitle="Nenhum imóvel ativo encontrado"
                        emptyStateDescription="Que tal adicionar seu primeiro imóvel agora?"
                    />
                </TabsContent>
                <TabsContent value="vendido">
                     <PropertyList 
                        properties={properties}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleDeleteProperty}
                        onStatusChange={mutate}
                        emptyStateTitle="Nenhum imóvel vendido"
                        emptyStateDescription="Imóveis marcados como 'vendido' aparecerão aqui."
                    />
                </TabsContent>
                <TabsContent value="alugado">
                     <PropertyList 
                        properties={properties}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleDeleteProperty}
                        onStatusChange={mutate}
                        emptyStateTitle="Nenhum imóvel alugado"
                        emptyStateDescription="Imóveis marcados como 'alugado' aparecerão aqui."
                    />
                </TabsContent>
            </Tabs>

        </div>
    );
}
