
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface MarketingContent {
  hero_media_url?: string | null;
  hero_media_type?: 'image' | 'video' | null;
}

interface MarketingHeroProps {
  content?: MarketingContent | null;
  maxWidthClass?: string;
}

const fadeUpContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, when: 'beforeChildren' } },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function MarketingHero({ content, maxWidthClass = 'max-w-3xl' }: MarketingHeroProps) {
  const mediaUrl = content?.hero_media_url || null;
  const mediaType = content?.hero_media_type ?? 'image';

  // Usando um fallback de uma imagem placeholder local.
  const fallback = "/hero-placeholder.jpg"; // Supondo que você adicionará este arquivo em /public

  return (
    <section className="text-white pt-24">
      {/* Conteúdo de Texto */}
      <div className="text-center p-6">
        <motion.div
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`${maxWidthClass} w-full mx-auto`}
        >
          <motion.h1 variants={fadeUpItem} className="text-3xl md:text-5xl font-extrabold leading-tight">
            A plataforma completa para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400">
              corretores e imobiliárias
            </span>
          </motion.h1>

          <motion.p variants={fadeUpItem} className="mt-4 text-lg text-white/80">
            Gerencie anúncios, leads e comissões — tudo em um só lugar.
          </motion.p>

          <motion.div variants={fadeUpItem} className="mt-8 flex gap-3 justify-center flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg"
            >
              Iniciar 7 dias grátis
            </Link>

            <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition">
              Conhecer recursos
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Imagem Simples Abaixo do Texto */}
      <div className="relative w-full max-w-5xl mx-auto mt-12 aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl">
        {mediaType === 'video' && mediaUrl ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            aria-hidden
          />
        ) : (
          <Image
            src={mediaUrl || fallback}
            alt="Apresentação da plataforma"
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
            className="object-cover"
          />
        )}
      </div>
    </section>
  );
}
