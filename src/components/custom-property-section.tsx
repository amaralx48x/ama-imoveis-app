
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

interface CustomPropertySectionProps {
  title: string;
  properties: Property[];
  agent: Agent;
  sectionId: string;
}

export function CustomPropertySection({ title, properties, agent, sectionId }: CustomPropertySectionProps) {
  
  const propertiesPerSection = agent.siteSettings?.propertiesPerSection || 4;
  const visibleProperties = useMemo(() => properties.slice(0, propertiesPerSection), [properties, propertiesPerSection]);

  const carouselItemBasis = useMemo(() => {
    switch (propertiesPerSection) {
      case 3: return "lg:basis-1/3";
      case 4: return "lg:basis-1/4";
      case 5: return "lg:basis-1/5";
      case 6: return "lg:basis-1/6";
      case 7: return "lg:basis-1/5"; 
      case 8: return "lg:basis-1/6"; 
      default: return "lg:basis-1/3";
    }
  }, [propertiesPerSection]);

  if (visibleProperties.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
            <div className="mb-4 sm:mb-0">
                <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                    <span className="text-gradient">{title}</span>
                </h2>
                <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                    Uma seleção especial de imóveis para você.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link href={`/search-results?agentId=${agent.id}&sectionId=${sectionId}`}>
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

    