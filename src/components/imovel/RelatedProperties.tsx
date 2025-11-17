
'use client';

import type { Property } from "@/lib/data";
import { useMemo } from "react";
import { PropertyCard } from "../property-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface RelatedPropertiesProps {
    currentProperty: Property;
    allProperties: Property[];
}

export function RelatedProperties({ currentProperty, allProperties }: RelatedPropertiesProps) {
    
    const relatedProperties = useMemo(() => {
        if (!currentProperty || allProperties.length <= 1) {
            return [];
        }

        // Critério 1: Busca por imóveis com mesmo tipo, cidade e operação.
        const primaryMatches = allProperties.filter(prop => 
            prop.id !== currentProperty.id &&
            prop.city === currentProperty.city &&
            prop.type === currentProperty.type &&
            prop.operation === currentProperty.operation
        );

        if (primaryMatches.length > 0) {
            return primaryMatches.slice(0, 4); // Limita a 4 imóveis
        }

        // Critério 2 (Fallback): Busca por imóveis na mesma faixa de preço (+/- 20%)
        const priceRange = {
            min: currentProperty.price * 0.8,
            max: currentProperty.price * 1.2,
        };

        const priceMatches = allProperties.filter(prop => 
            prop.id !== currentProperty.id &&
            prop.price >= priceRange.min &&
            prop.price <= priceRange.max
        );
        
        return priceMatches.slice(0, 4); // Limita a 4 imóveis

    }, [currentProperty, allProperties]);

    // Só renderiza a seção se houver imóveis relacionados para mostrar
    if (relatedProperties.length === 0) {
        return null;
    }

    return (
         <section className="py-16 sm:py-24 border-t mt-16">
            <div className="container mx-auto px-4">
                <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                        Imóveis <span className="text-gradient">Relacionados</span>
                    </h2>
                    <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                        Talvez você também se interesse por estes imóveis.
                    </p>
                </div>

                <Carousel
                opts={{
                    align: "start",
                    loop: relatedProperties.length > 3,
                }}
                className="w-full"
                >
                <CarouselContent>
                    {relatedProperties.map((property) => (
                    <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
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
