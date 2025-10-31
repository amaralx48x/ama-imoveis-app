
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collectionGroup, query, where, getDocs, Query, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Property } from '@/lib/data';
import { PropertyCard } from '@/components/property-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Frown } from 'lucide-react';
import { filterProperties, type Filters } from '@/lib/filter-logic';

function SearchResults() {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
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

    useEffect(() => {
        if (!firestore) return;

        const fetchProperties = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Base query using collectionGroup to search across all agents' properties
                let q: Query<DocumentData> = collectionGroup(firestore, 'properties');

                const initialPropertiesSnap = await getDocs(q);
                let allProps = initialPropertiesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Property);

                // Apply client-side filtering
                const filtered = filterProperties(allProps, filters);

                setProperties(filtered);
            } catch (err) {
                console.error("Error fetching properties:", err);
                setError("Ocorreu um erro ao buscar os imóveis. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, [firestore, searchParams]);

    const hasFilters = Object.values(filters).some(v => v !== undefined);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                 <h1 className="text-3xl font-bold font-headline">Resultados da Busca</h1>
                 <p className="text-muted-foreground">
                    {hasFilters ? `Imóveis encontrados para sua busca.` : 'Explorando todos os imóveis disponíveis.'}
                </p>
            </div>

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
        <Suspense fallback={<div>Carregando...</div>}>
            <SearchResults />
        </Suspense>
    )
}
