
'use client';

import { MarketingContent } from '@/lib/data';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface MarketingHeroProps {
  content?: MarketingContent | null;
}

const neon = "bg-gradient-to-r from-primary via-accent to-[#B794F4]";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, when: "beforeChildren" },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function MarketingHero({ content }: MarketingHeroProps) {
  const mediaUrl = content?.hero_media_url;
  const mediaType = content?.hero_media_type;

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={container}
      className="relative w-full h-[70vh] min-h-[500px] md:h-[80vh] overflow-hidden flex items-center justify-center text-center text-white"
    >
      {/* Vídeo ou Imagem em Background */}
      {mediaUrl && (
        <>
          {mediaType === 'video' ? (
            <video
              key={mediaUrl}
              className="absolute top-0 left-0 w-full h-full object-cover -z-10"
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Plataforma para corretores e imobiliárias"
              className="absolute top-0 left-0 w-full h-full object-cover -z-10"
            />
          )}
        </>
      )}

      {/* Camada de escurecimento opcional */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Conteúdo por cima do vídeo */}
      <motion.div variants={fadeUp} className="relative z-10 max-w-3xl px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
          A plataforma completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA]">corretores e imobiliárias</span>
        </h2>

        <p className="mt-6 text-lg text-white/70">
          Gerencie anúncios, leads, visitas e comissões — tudo num só lugar. Painéis inteligentes, agenda integrada e site público para cada corretor.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/login" className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold ${neon} text-white shadow-lg hover:scale-[1.02] transition`}>
            Iniciar 7 dias grátis
          </Link>

          <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition">
            Conhecer recursos
          </a>
        </div>
      </motion.div>
    </motion.section>
  );
}
