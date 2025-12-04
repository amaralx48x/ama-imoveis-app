'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MarketingContent } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface MarketingHeroProps {
  content?: MarketingContent | null;
}

const fadeUpContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function MarketingHero({ content }: MarketingHeroProps) {
  const defaultHeroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
  const mediaUrl = content?.hero_media_url || defaultHeroImage?.imageUrl;
  const mediaType = mediaUrl ? (content?.hero_media_type || 'image') : 'image';

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center text-white text-center py-20 px-6 overflow-hidden">
      
      <div className="absolute inset-0 -z-20 bg-black">
        {mediaUrl && (
          <>
            {mediaType === 'video' ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover brightness-50"
              />
            ) : (
              <Image
                src={mediaUrl}
                alt="Plataforma para corretores e imobiliárias"
                fill
                priority
                className="object-cover brightness-50"
                sizes="100vw"
              />
            )}
          </>
        )}
      </div>

      <motion.div 
        variants={fadeUpContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="max-w-3xl z-10"
      >
        <motion.h2 variants={fadeUpItem} className="text-4xl md:text-5xl font-extrabold leading-tight">
          A plataforma completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA]">corretores e imobiliárias</span>
        </motion.h2>

        <motion.p variants={fadeUpItem} className="mt-6 text-lg text-white/70">
          Gerencie anúncios, leads, visitas e comissões — tudo num só lugar. Painéis inteligentes, agenda integrada e site público para cada corretor.
        </motion.p>

        <motion.div variants={fadeUpItem} className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/login" className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white shadow-lg hover:scale-[1.02] transition`}>
            Iniciar 7 dias grátis
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
