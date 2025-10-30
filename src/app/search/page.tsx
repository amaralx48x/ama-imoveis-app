import { PropertyCard } from "@/components/property-card";
import { PropertySearchForm } from "@/components/property-search-form";
import { getAllProperties } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Property } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let properties = getAllProperties();

  if (searchParams) {
    properties = properties.filter(p => {
      const { operation, city, type } = searchParams;
      if (operation && p.operation !== operation) return false;
      if (city && p.city !== city) return false;
      if (type && p.type !== type) return false;
      return true;
    });
  }

  const propertyImages = (p: Property) => PlaceHolderImages.find(img => img.id === p.images[0]) || PlaceHolderImages[0];

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-card p-6 rounded-lg shadow-md mb-8">
            <h1 className="text-3xl font-headline font-bold mb-4">Buscar Imóveis</h1>
            <PropertySearchForm />
          </div>

          {properties.length > 0 ? (
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
