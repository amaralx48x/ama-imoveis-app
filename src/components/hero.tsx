import Image from "next/image";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

interface HeroProps {
  heroImage?: ImagePlaceholder;
}

export function Hero({ heroImage }: HeroProps) {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-white">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover -z-20"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-black/60 -z-10" />
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-4 animate-fade-in-up">
          Encontre o <span className="text-gradient">Imóvel</span> dos Seus Sonhos
        </h1>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-8">
          As melhores oportunidades do mercado imobiliário para você.
        </p>
      </div>
    </section>
  );
}
