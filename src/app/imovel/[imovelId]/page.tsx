import { getPropertyById } from "@/lib/data";
import { notFound } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PropertyGallery } from "@/components/imovel/property-gallery";
import { PropertyInfo } from "@/components/imovel/property-info";
import { ScheduleVisitForm } from "@/components/imovel/schedule-visit-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function PropertyPage({ params }: { params: { imovelId: string } }) {
  const property = getPropertyById(params.imovelId);
  if (!property) {
    notFound();
  }

  const propertyImages = property.images
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
