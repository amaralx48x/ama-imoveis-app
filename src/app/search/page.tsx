
'use client';
import { PropertyCard } from "@/components/property-card";
import { PropertySearchForm } from "@/components/property-search-form";
import type { Property } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useFirestore } from "@/firebase";
import { collectionGroup, query, where, getDocs, Query } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function SearchResults() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!firestore) return;
      setLoading(true);

      const operation = searchParams.get('operation');
      const city = searchParams.get('city');
      const type = searchParams.get('type');

      let propertiesQuery: Query = collectionGroup(firestore, 'properties');
      
      const conditions: any[] = [];
      if (operation) conditions.push(where('operation', '==', operation));
      if (city) conditions.push(where('city', '==', city));
      if (type) conditions.push(where('type', '==', type));

      if (conditions.length > 0) {
        propertiesQuery = query(collectionGroup(firestore, 'properties'), ...conditions);
      }

      const querySnapshot = await getDocs(propertiesQuery);
      const props: Property[] = [];
      querySnapshot.forEach((doc) => {
        // Here we include the agentId from the parent document path
        const parentPath = doc.ref.parent.parent;
        const agentId = parentPath ? parentPath.id : undefined;
        props.push({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId });
      });

      setProperties(props);
      setLoading(false);
    };

    fetchProperties();
  }, [firestore, searchParams]);


  if (loading) {
    return (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    )
  }

  return properties.length > 0 ? (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  ) : (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold mb-2">Nenhum imóvel encontrado</h2>
      <p className="text-muted-foreground">Tente ajustar seus filtros de busca.</p>
    </div>
  );
}


export default function SearchPage() {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-card p-6 rounded-lg shadow-md mb-8">
            <h1 className="text-3xl font-headline font-bold mb-4">Buscar Imóveis</h1>
            <PropertySearchForm />
          </div>
          <Suspense fallback={
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          }>
            <SearchResults />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
