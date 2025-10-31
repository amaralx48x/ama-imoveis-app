
'use client';

import { useSearchParams, notFound } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Property } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PropertyGallery } from '@/components/imovel/property-gallery';
import { PropertyInfo } from '@/components/imovel/property-info';
import { ScheduleVisitForm } from '@/components/imovel/schedule-visit-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingSkeleton() {
  return (
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
  );
}

export function PropertyView({ imovelId }: { imovelId: string }) {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');

  const propertyRef = useMemoFirebase(() => {
    // Only create the reference if all required IDs are present.
    if (!firestore || !agentId || !imovelId) return null;
    return doc(firestore, `agents/${agentId}/properties`, imovelId);
  }, [firestore, agentId, imovelId]);

  const { data: property, isLoading } = useDoc<Property>(propertyRef);

  // If agentId isn't available from URL yet, or if useDoc is loading, show skeleton.
  if (isLoading || !agentId) {
    return <LoadingSkeleton />;
  }

  // After loading, if we have an agentId but still no property, then it's a 404.
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
  );
}
