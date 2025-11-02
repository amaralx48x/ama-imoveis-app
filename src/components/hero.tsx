
'use client';

import Image from "next/image";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import type { ReactNode } from "react";
import PropertyFilters from "./property-filters";
import type { Agent } from "@/lib/data";

interface HeroProps {
  heroImage?: ImagePlaceholder;
  children?: ReactNode;
  agent?: Agent | null;
  propertyTypes?: string[];
}

export function Hero({ agent, propertyTypes }: HeroProps) {

  return (
    <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)'}}>
      <div className="container mx-auto px-4 text-center mt-[-10rem] z-10" style={{color: 'var(--text-color)'}}>
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-4 animate-fade-in-up">
          Encontre o <span className="text-gradient">Imóvel</span> dos Seus Sonhos
        </h1>
        <p className="text-lg md:text-xl text-current/80 max-w-2xl mx-auto mb-8">
          As melhores oportunidades do mercado imobiliário para você.
        </p>
      </div>
       <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 z-20'>
           {agent && propertyTypes && <PropertyFilters agent={agent} propertyTypes={propertyTypes} />}
        </div>
    </section>
  );
}
