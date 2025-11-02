
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collectionGroup, query, getDocs, Query, DocumentData, collection, doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Property, Agent } from '@/lib/data';
import { PropertyCard } from '@/components/property-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown, ArrowLeft } from 'lucide-react';
import { filterProperties, type Filters } from '@/lib/filter-logic';
import { Button } from '@/components/ui/button';
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes as getStaticPropertyTypes } from '@/lib/data';

function BackButton() {
    const router = useRouter();
    return (
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
    );
}

function SearchResults() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<Property[]>([]);
    const [agent, setAgent] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const agentId = searchParams.get('agentId');
    const sectionId = searchParams.get('sectionId');
    
    const filters: Filters = {
        operation: searchParams.get('operation') || undefined,
        city: searchParams.get('city') || undefined,
        type: searchParams.get('type') || undefined,
        minPrice: searchParams.get('minPrice') || undefined,
        maxPrice: searchParams.get('maxPrice') || undefined,
        bedrooms: searchParams.get('bedrooms') || undefined,
        garage: searchParams.get('garage') || undefined,
        keyword: searchParams.get('keyword') || undefined,
    };
    
    const propertyTypes = getStaticPropertyTypes();

    useEffect(() => {
        if (!firestore) return;

        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let agentData: Agent | null = null;
                // 1. Fetch Agent if agentId is present
                if (agentId) {
                    const agentRef = doc(firestore, 'agents', agentId);
                    const agentSnap = await getDoc(agentRef);
                    if (agentSnap.exists()) {
                        agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
                        setAgent(agentData);
                    }
                }

                // 2. Fetch Properties
                let q: Query<DocumentData>;
                if (agentId) {
                    q = collection(firestore, 'agents', agentId, 'properties');
                } else {
                    q = collectionGroup(firestore, 'properties');
                }
                const initialPropertiesSnap = await getDocs(q);
                let allProps = initialPropertiesSnap.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id, agentId: docSnap.ref.parent.parent?.id }) as Property);

                // 3. Apply Filters
                let finalFiltered = allProps;
                 if (sectionId) {
                    finalFiltered = finalFiltered.filter(p => (p.sectionIds || []).includes(sectionId));
                }
                finalFiltered = filterProperties(finalFiltered, filters);
                
                setProperties(finalFiltered);

            } catch (err: any) {
                console.error("Error fetching properties:", err);
                setError("Ocorreu um erro ao buscar os imóveis. Se o erro persistir, pode ser necessário criar um índice no Firestore. Consulte o console para mais detalhes.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firestore, agentId, searchParams]); // Rerun when searchParams change

    const hasFilters = Object.values(filters).some(v => v !== undefined) || sectionId;

    return (
        <div className="container mx-auto px-4 py-8">
            <BackButton />

            <div className="mb-8 space-y-4">
                 <h1 className="text-3xl font-bold font-headline">Resultados da Busca</h1>
                 <p className="text-muted-foreground">
                    {hasFilters ? `Imóveis encontrados para sua busca.` : 'Explorando todos os imóveis disponíveis.'}
                </p>
            </div>
            
            {agent && (
                <div className="mb-12">
                     <PropertyFilters agent={agent} propertyTypes={propertyTypes} />
                </div>
            )}

            {isLoading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex flex-col space-y-3">
                            <Skeleton className="h-[224px] w-full rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Erro na Busca</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && properties.length === 0 && (
                <div className="text-center py-16 rounded-lg border-2 border-dashed">
                    <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mt-4">Nenhum imóvel encontrado</h2>
                    <p className="text-muted-foreground mt-2">
                        Tente ajustar seus filtros ou fazer uma busca diferente.
                    </p>
                </div>
            )}

            {!isLoading && !error && properties.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map(property => (
                        <PropertyCard key={`${property.agentId}-${property.id}`} property={property} />
                    ))}
                </div>
            )}
        </div>
    );
}


export default function SearchPage() {
    return (
        <Suspense fallback={
             <div className="flex items-center justify-center h-screen bg-background">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    )
}
