
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PropertyFilters from "@/components/property-filters";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/firebase";
import { collectionGroup, query, getDocs, DocumentData, Query } from "firebase/firestore";
import type { Property } from "@/lib/data";
import { filterProperties, type Filters } from "@/lib/filter-logic";
import { Skeleton } from "@/components/ui/skeleton";
import { Frown, ArrowLeft } from "lucide-react";


function BackButton() {
    const router = useRouter();
    return (
        <Button variant="outline" onClick={() => router.back()} className="mb-6 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
    );
}

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

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
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const q: Query<DocumentData> = query(collectionGroup(firestore, 'properties'));
        const querySnapshot = await getDocs(q);
        const allProps = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, agentId: doc.ref.parent.parent?.id }) as Property);

        const filtered = filterProperties(allProps, filters);
        setProperties(filtered);
      } catch (error) {
        console.error("Erro ao buscar imóveis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams, firestore]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="mb-6">
        <PropertyFilters />
      </div>

      {loading ? (
         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[225px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <Suspense fallback={<div className="text-center p-10">Carregando...</div>}>
            <SearchResults />
        </Suspense>
    );
}

