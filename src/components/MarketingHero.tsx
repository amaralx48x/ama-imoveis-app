
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
  const fallback = "/hero-placeholder.jpg"; 

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center text-white">
      {/* Camada da Imagem de Fundo */}
      <div className="absolute inset-0">
        {mediaType === 'video' && mediaUrl ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={mediaUrl || fallback}
            alt="Apresentação da plataforma"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        )}
        {/* Sobreposição para legibilidade */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Camada de Conteúdo (Sobreposta) */}
      <div className="relative z-10 container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        <motion.div
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center md:text-left"
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

          <motion.div variants={fadeUpItem} className="mt-8 flex gap-3 justify-center md:justify-start flex-wrap">
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
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="hidden md:flex justify-center"
        >
            <Image 
                src="https://images.unsplash.com/photo-1628191137426-c2ea7e2b30c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwaG9uZSUyMGFwcCUyMG1vY2t1cHxlbnwwfHx8fDE3NjIyNjc0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Aplicativo em um celular"
                width={300}
                height={600}
                className="rounded-3xl shadow-2xl"
                data-ai-hint="phone app mockup"
            />
        </motion.div>
      </div>
    </section>
  );
}
