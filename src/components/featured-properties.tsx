import type { Property } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PropertyCard } from "./property-card";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

interface FeaturedPropertiesProps {
  properties: Property[];
  images: ImagePlaceholder[];
}

export function FeaturedProperties({ properties, images }: FeaturedPropertiesProps) {
  return (
    <section className="py-16 sm:py-24 bg-background" id="destaques">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
            Imóveis em <span className="text-gradient">Destaque</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Confira uma seleção exclusiva de imóveis que separamos para você.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {properties.map((property, index) => (
              <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <PropertyCard property={property} imagePlaceholder={images[index]} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
