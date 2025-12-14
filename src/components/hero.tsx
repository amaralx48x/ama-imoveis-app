'use client';

import Image from "next/image";
import type { ReactNode } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface HeroProps {
  children?: ReactNode;
  heroImageUrl?: string | null;
  heroImageUrlMobile?: string | null;
  heroHeadline?: string | null;
  heroSubtext?: string | null;
}

export function Hero({
  children,
  heroImageUrl,
  heroImageUrlMobile,
  heroHeadline,
  heroSubtext,
}: HeroProps) {
  const fallbackImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );

  const desktopImage =
    heroImageUrl ||
    fallbackImage?.imageUrl ||
    "https://picsum.photos/seed/hero-desktop/1920/1080";

  const mobileImage = heroImageUrlMobile || desktopImage;

  const headline = heroHeadline || "Encontre o Imóvel dos Seus Sonhos";
  const subtext =
    heroSubtext ||
    "As melhores oportunidades do mercado imobiliário para você.";

  return (
    <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {/* Desktop */}
        <div className="hidden md:block relative w-full h-full">
          <Image
            key="hero-desktop"
            src={desktopImage}
            alt="Imagem principal do site"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 100vw"
          />
        </div>

        {/* Mobile */}
        <div className="block md:hidden relative w-full h-full">
          <Image
            key="hero-mobile"
            src={mobileImage}
            alt="Imagem principal do site"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 767px) 100vw"
          />
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />

      {/* Conteúdo */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-4">
          <span className="text-gradient">{headline}</span>
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
          {subtext}
        </p>
      </div>

      {/* Children (filtros) */}
      {children && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 z-20">
          {children}
        </div>
      )}
    </section>
  );
}
