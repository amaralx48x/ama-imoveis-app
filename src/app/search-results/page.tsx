
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { collection, collectionGroup, query, getDocs, where } from "firebase/firestore";
import type { Property } from "@/lib/data";
import { filterProperties, type Filters } from "@/lib/filter-logic";
import { Skeleton } from "@/components/ui/skeleton";
import { Frown, ArrowLeft } from "lucide-react";
import PropertyFilters from "@/components/property-filters";
import { getPropertyTypes } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";


export function SearchResultsContent({ properties, isLoading }: { properties: Property[], isLoading?: boolean }) {
    if (isLoading) {
        return (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[225px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (properties.length === 0) {
        return (
             <div className="text-center py-16 rounded-lg border-2 border-dashed">
                <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-bold mt-4">Nenhum imóvel encontrado</h2>
                <p className="text-muted-foreground mt-2">
                    Tente ajustar seus filtros ou fazer uma busca diferente.
                </p>
            </div>
        )
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
        </div>
    );
}

function SearchResultsPageContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  const agentId = searchParams.get('agentId');
  const propertyTypes = getPropertyTypes();

  const fetchData = useCallback(async (firestoreInstance: any, currentParams: URLSearchParams) => {
    setLoading(true);
    
    const filters: Filters = {
        operation: currentParams.get('operation') || undefined,
        city: currentParams.get('city') === 'outras' ? undefined : currentParams.get('city') || undefined,
        type: currentParams.get('type') || undefined,
        bedrooms: currentParams.get('bedrooms') || undefined,
        garage: currentParams.get('garage') || undefined,
        keyword: currentParams.get('keyword') || undefined,
        agentId: currentParams.get('agentId') || undefined,
        sectionId: currentParams.get('sectionId') || undefined,
        minPrice: currentParams.get('minPrice') || undefined,
        maxPrice: currentParams.get('maxPrice') || undefined,
        sortBy: currentParams.get('sortBy') as Filters['sortBy'] || undefined,
    };
    
    try {
      const q = filters.agentId
        ? query(collection(firestoreInstance, `agents/${filters.agentId}/properties`), where('status', '==', 'ativo'))
        : query(collectionGroup(firestoreInstance, 'properties'), where('status', '==', 'ativo'));
      
      const querySnapshot = await getDocs(q);
      
      const uniqueProperties = new Map<string, Property>();
      querySnapshot.forEach(doc => {
          const docId = doc.id;
          if (!uniqueProperties.has(docId)) {
            uniqueProperties.set(docId, { 
                ...(doc.data() as Omit<Property, 'id'>), 
                id: docId, 
                agentId: doc.ref.parent.parent?.id 
            } as Property);
          }
      });
      const allProps = Array.from(uniqueProperties.values());
      
      const filtered = filterProperties(allProps, filters);
      setProperties(filtered);
      
    } catch (error) {
      console.error("Erro ao buscar imóveis:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!firestore) return;
    fetchData(firestore, searchParams);
  }, [searchParams, firestore, fetchData]);

  return (
    <>
      <Header agentId={agentId || undefined} />
      <main className="container mx-auto p-6 min-h-screen">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()} className="mb-6 flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
          </Button>
        </div>

        <div className="mb-8">
          <PropertyFilters propertyTypes={propertyTypes}/>
        </div>
        
        <h1 className="text-3xl font-bold font-headline mb-6">Resultados da Busca</h1>
        
        <SearchResultsContent properties={properties} isLoading={loading} />

      </main>
      <Footer agentId={agentId || undefined} />
    </>
  );
}

export default function SearchResultsPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center">
                 <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        }>
            <SearchResultsPageContainer />
        </Suspense>
    );
}

