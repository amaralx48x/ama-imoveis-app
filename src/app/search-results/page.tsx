
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import PropertyFilters from "@/components/property-filters";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { collectionGroup, query, getDocs, DocumentData, Query, where } from "firebase/firestore";
import type { Property, Agent } from "@/lib/data";
import { filterProperties, type Filters } from "@/lib/filter-logic";
import { Skeleton } from "@/components/ui/skeleton";
import { Frown, ArrowLeft, ArrowDownUp } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";


function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<Filters['sortBy'] | ''>(searchParams.get('sortBy') || '');
  const firestore = useFirestore();

  const agentId = searchParams.get('agentId');

  // Mock agent para popular os filtros de cidade, etc.
  const mockAgent: Agent = {
    id: 'global',
    displayName: 'Global Search',
    name: 'AMA Imóveis',
    accountType: 'imobiliaria',
    email: '',
    description: '',
    creci: '',
    photoUrl: '',
    cities: ['São Paulo', 'Campinas', 'Ubatuba', 'Guarujá', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'],
  }
  const propertyTypes = ['Apartamento', 'Casa', 'Chácara', 'Galpão', 'Sala', 'Kitnet', 'Terreno', 'Lote', 'Alto Padrão'];

  const fetchData = useCallback(async (firestoreInstance: any, currentParams: URLSearchParams) => {
    setLoading(true);
    const filters: Filters = {
        operation: currentParams.get('operation') || undefined,
        city: currentParams.get('city') || undefined,
        type: currentParams.get('type') || undefined,
        bedrooms: currentParams.get('bedrooms') || undefined,
        garage: currentParams.get('garage') || undefined,
        keyword: currentParams.get('keyword') || undefined,
        agentId: currentParams.get('agentId') || undefined,
        sectionId: currentParams.get('sectionId') || undefined,
        minPrice: currentParams.get('minPrice') || undefined,
        maxPrice: currentParams.get('maxPrice') || undefined,
        sortBy: sortBy as Filters['sortBy'] || undefined,
    };
    
    try {
      // Query simplificada: Busca global em todas as propriedades sem filtros no DB
      const q = query(collectionGroup(firestoreInstance, 'properties'));
      
      const querySnapshot = await getDocs(q);
      const allProps = querySnapshot.docs.map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: doc.ref.parent.parent?.id }) as Property);
      
      // Aplicar filtros e ordenação no cliente
      const filtered = filterProperties(allProps, filters);
      setProperties(filtered);
      
    } catch (error) {
      console.error("Erro ao buscar imóveis:", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    if (!firestore) return;
    fetchData(firestore, searchParams);
  }, [searchParams, firestore, fetchData]);

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <div className="mb-4">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
        </Button>
      </div>

      <div className="mb-8">
        <PropertyFilters agent={mockAgent} propertyTypes={propertyTypes}/>
      </div>
      
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold font-headline">Resultados da Busca</h1>
            <div className="flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as Filters['sortBy'])}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="price-asc">Preço: Crescente</SelectItem>
                        <SelectItem value="price-desc">Preço: Decrescente</SelectItem>
                    </SelectContent>
                </Select>
            </div>
      </div>

      {loading ? (
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
      ) : properties.length === 0 ? (
        <div className="text-center py-16 rounded-lg border-2 border-dashed">
            <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-bold mt-4">Nenhum imóvel encontrado</h2>
            <p className="text-muted-foreground mt-2">
                Tente ajustar seus filtros ou fazer uma busca diferente.
            </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchResultsPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center">
                 <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}

    