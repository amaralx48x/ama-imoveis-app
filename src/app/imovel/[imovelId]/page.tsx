
'use client';
import { notFound } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PropertyGallery } from "@/components/imovel/property-gallery";
import { PropertyInfo } from "@/components/imovel/property-info";
import { ScheduleVisitForm } from "@/components/imovel/schedule-visit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collectionGroup, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Property } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";


export default function PropertyPage({ params: { imovelId } }: { params: { imovelId: string } }) {
  const firestore = useFirestore();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !imovelId) return;

    const findProperty = async () => {
      setLoading(true);
      const propertiesRef = collectionGroup(firestore, 'properties');
      const q = query(propertiesRef, where('id', '==', imovelId));
      
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const propertyDoc = querySnapshot.docs[0];
          setProperty(propertyDoc.data() as Property);
        } else {
          setProperty(null);
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    findProperty();
  }, [firestore, imovelId]);


  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-[50vh] w-full rounded-lg" />
                <Skeleton className="h-[20vh] w-full rounded-lg" />
              </div>
              <div className="lg:col-span-1 space-y-8">
                <Skeleton className="h-[40vh] w-full rounded-lg" />
                <Skeleton className="h-[40vh] w-full rounded-lg" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!property) {
    notFound();
  }

  const propertyImages = (property.imageUrls || [])
    .map(id => PlaceHolderImages.find(img => img.id === id))
    .filter((img): img is NonNullable<typeof img> => img !== undefined);
  
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PropertyGallery property={property} images={propertyImages} />
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Descrição do Imóvel</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
              <PropertyInfo property={property} />
              <ScheduleVisitForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
