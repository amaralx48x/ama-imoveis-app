'use client';
import { PropertyCard } from "@/components/property-card";
import { PropertySearchForm } from "@/components/property-search-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Property } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";


export default function SearchPage() {
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

      let propertiesQuery = query(collectionGroup(firestore, 'properties'));
      
      // This is not efficient on Firestore. You'd need composite indexes for this to work well.
      // For this example, we proceed, but in a real app, this search strategy should be revised.
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
        props.push(doc.data() as Property);
      });

      setProperties(props);
      setLoading(false);
    };

    fetchProperties();
  }, [firestore, searchParams]);


  const propertyImages = (p: Property) => {
    const imageId = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : p.images?.[0];
    return PlaceHolderImages.find(img => img.id === imageId) || PlaceHolderImages[0];
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-card p-6 rounded-lg shadow-md mb-8">
            <h1 className="text-3xl font-headline font-bold mb-4">Buscar Imóveis</h1>
            <PropertySearchForm />
          </div>

          {loading ? (
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
          ) : properties.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} imagePlaceholder={propertyImages(property)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-2">Nenhum imóvel encontrado</h2>
              <p className="text-muted-foreground">Tente ajustar seus filtros de busca.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
