
'use client';
import { notFound, useSearchParams } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PropertyGallery } from "@/components/imovel/property-gallery";
import { PropertyInfo } from "@/components/imovel/property-info";
import { ScheduleVisitForm } from "@/components/imovel/schedule-visit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Property } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyPage({ params }: { params: { imovelId: string } }) {
  const { imovelId } = params;
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');

  const propertyRef = useMemoFirebase(() => {
    if (!firestore || !agentId || !imovelId) return null;
    return doc(firestore, `agents/${agentId}/properties`, imovelId);
  }, [firestore, agentId, imovelId]);

  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  // Show loading skeleton if we don't have agentId yet, or if useDoc is loading.
  if (isLoading || !agentId) {
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

  // After loading, if there's still no property, then it's a 404.
  if (!property) {
    notFound();
  }

  const propertyImages = (property?.imageUrls || [])
    .map(id => PlaceHolderImages.find(img => img.id === id))
    .filter((img): img is NonNullable<typeof img> => img !== undefined);
  
  if (propertyImages.length === 0) {
      const defaultImage = PlaceHolderImages.find(img => img.id === 'property-1-1');
      if (defaultImage) propertyImages.push(defaultImage);
  }

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

