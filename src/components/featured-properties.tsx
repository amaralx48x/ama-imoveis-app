
import type { Property, Agent } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PropertyCard } from "./property-card";
import { Button } from "./ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";

interface FeaturedPropertiesProps {
  properties: Property[];
  agent: Agent;
}

export function FeaturedProperties({ properties, agent }: FeaturedPropertiesProps) {
  
  const propertiesPerSection = agent.siteSettings?.propertiesPerSection || 4;
  const visibleProperties = useMemo(() => properties.slice(0, propertiesPerSection), [properties, propertiesPerSection]);

  const carouselItemBasis = useMemo(() => {
    switch (propertiesPerSection) {
      case 3: return "lg:basis-1/3";
      case 4: return "lg:basis-1/4";
      case 5: return "lg:basis-1/5";
      case 6: return "lg:basis-1/6";
      case 7: return "lg:basis-1/5"; // Reutiliza para melhor encaixe
      case 8: return "lg:basis-1/6"; // Reutiliza para melhor encaixe
      default: return "lg:basis-1/3";
    }
  }, [propertiesPerSection]);

  return (
    <section className="py-16 sm:py-24 bg-background" id="destaques">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
            <div className="mb-4 sm:mb-0">
                <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                    Imóveis em <span className="text-gradient">Destaque</span>
                </h2>
                <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                    Confira uma seleção exclusiva de imóveis que separamos para você.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link href={`/search-results?agentId=${agent.id}`}>
                    Ver Todos os Imóveis
                    <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: visibleProperties.length > 3,
          }}
          className="w-full"
        >
          <CarouselContent>
            {visibleProperties.map((property) => (
              <CarouselItem key={property.id} className={`md:basis-1/2 ${carouselItemBasis}`}>
                <div className="p-1">
                  <PropertyCard property={property} />
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

    