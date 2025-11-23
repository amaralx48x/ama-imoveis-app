
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

  // Usando um fallback de uma imagem placeholder local se existir, ou um data URL seguro.
  const fallback = "/hero-placeholder.jpg"; // Supondo que você adicionará este arquivo em /public

  return (
    <section className="relative h-screen text-white">
      {/* Background */}
      <div className="absolute inset-0 z-[-1] bg-black/40">
        {mediaType === 'video' && mediaUrl ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-70"
            aria-hidden
          />
        ) : (
          <Image
            src={mediaUrl || fallback}
            alt="Imagem de apresentação"
            fill
            priority
            unoptimized // Essencial para fallbacks ou URLs não configuradas
            sizes="100vw"
            className="object-cover opacity-70"
          />
        )}
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 h-full flex items-center justify-center text-center p-6">
        <motion.div
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`${maxWidthClass} w-full`}
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
    </section>
  );
}

