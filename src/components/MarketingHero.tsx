'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface MarketingContent {
  hero_media_url?: string | null;
  hero_media_type?: 'image' | 'video' | null;
  /** outros campos... */
}

interface MarketingHeroProps {
  content?: MarketingContent | null;
  /** largura máxima do hero (tailwind class) */
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
  const mediaUrl = content?.hero_media_url;
  const mediaType = content?.hero_media_type ?? 'image';

  // fallback seguro (1x1 transparent gif) para evitar erros de layout se não houver imagem
  const fallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center text-white text-center py-20 px-6 overflow-hidden">
      {/* Background layer (sempre renderizado no servidor também) */}
      <div className="absolute inset-0 -z-10 bg-black">
        {/* Se for vídeo, usamos <video> (nativo). Se for imagem, usamos next/image com fill */}
        {mediaUrl && mediaType === 'video' ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover brightness-50"
            aria-hidden
          />
        ) : (
          // NEXT IMAGE com fill: mantém layout estável e evita flicker/hydration mismatch
          <div className="absolute inset-0 w-full h-full">
            <Image
              src={mediaUrl || fallback}
              alt="Imagem de apresentação"
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-50"
              // se a url externa não estiver em domains do next.config.js, next/image pode falhar;
              // nesse caso, use <img src=...> simples. Para segurança deixamos Image por padrão.
            />
          </div>
        )}
      </div>

      {/* Conteúdo central (animado no client) */}
      <motion.div
        variants={fadeUpContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className={`${maxWidthClass} z-10 px-4`}
      >
        <motion.h1 variants={fadeUpItem} className="text-3xl md:text-5xl font-extrabold leading-tight">
          A plataforma completa para{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400">
            corretores e imobiliárias
          </span>
        </motion.h1>

        <motion.p variants={fadeUpItem} className="mt-4 text-lg text-white/75">
          Gerencie anúncios, leads e comissões — tudo em um só lugar.
        </motion.p>

        <motion.div variants={fadeUpItem} className="mt-8 flex gap-3 justify-center flex-wrap">
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg"
          >
            Iniciar 7 dias grátis
          </a>
          <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition">
            Conhecer recursos
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}