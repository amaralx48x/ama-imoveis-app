
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

export function Hero({ heroImage, children, agent, propertyTypes }: HeroProps) {
  const imageUrl = heroImage?.imageUrl ?? `https://picsum.photos/seed/hero/1920/1080`;
  const imageHint = heroImage?.imageHint ?? 'modern living room';
  const altText = heroImage?.description ?? 'Imagem de fundo da seção principal';

  return (
    <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center text-white">
      <Image
        src={imageUrl}
        alt={altText}
        fill
        className="object-cover -z-20"
        priority
        data-ai-hint={imageHint}
      />
      <div className="absolute inset-0 bg-black/60 -z-10" />
      <div className="container mx-auto px-4 text-center mt-[-10rem]">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-4 animate-fade-in-up">
          Encontre o <span className="text-gradient">Imóvel</span> dos Seus Sonhos
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          As melhores oportunidades do mercado imobiliário para você.
        </p>
      </div>
       <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4'>
           {agent && propertyTypes && <PropertyFilters agent={agent} propertyTypes={propertyTypes} />}
        </div>
      {children}
    </section>
  );
}
