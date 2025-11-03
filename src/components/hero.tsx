
'use client';

import Image from "next/image";
import type { ReactNode } from "react";
import PropertyFilters from "./property-filters";
import type { Agent } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface HeroProps {
  children?: ReactNode;
  agent?: Agent | null;
  propertyTypes?: string[];
}

export function Hero({ agent, propertyTypes }: HeroProps) {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center text-white mb-24">
       {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          sizes="100vw"
          className="object-cover -z-10 brightness-50"
          data-ai-hint={heroImage.imageHint}
          priority
        />
      )}
      <div className="container mx-auto px-4 text-center z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-4 animate-fade-in-up">
          Encontre o <span className="text-gradient">Imóvel</span> dos Seus Sonhos
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
          As melhores oportunidades do mercado imobiliário para você.
        </p>
      </div>
       <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 z-20'>
           {agent && propertyTypes && <PropertyFilters agent={agent} propertyTypes={propertyTypes} />}
        </div>
    </section>
  );
}
