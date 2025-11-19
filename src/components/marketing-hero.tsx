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
      className="relative min-h-[70vh] flex items-center justify-center text-white text-center py-20 px-6"
    >
      {mediaUrl && (
        <>
          <div className="absolute inset-0 bg-black -z-20" />
          {mediaType === 'video' ? (
            <video
              key={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover -z-10 brightness-50"
            >
              <source src={mediaUrl} type="video/mp4" />
              Seu navegador não suporta a tag de vídeo.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt="Plataforma para corretores e imobiliárias"
              className="absolute inset-0 w-full h-full object-cover -z-10 brightness-50"
            />
          )}
        </>
      )}

      <motion.div variants={fadeUp} className="max-w-3xl z-10">
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

        <div className="mt-8 flex gap-6 justify-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white/5">
                  ⭐
                </div>
                <div>
                  <div className="font-semibold">Avaliações reais</div>
                  <div className="text-xs text-white/60">Mais de 4.8 de satisfação</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white/5">
                  🔒
                </div>
                <div>
                  <div className="font-semibold">Segurança</div>
                  <div className="text-xs text-white/60">Dados criptografados</div>
                </div>
              </div>
            </div>

      </motion.div>
    </motion.section>
  );
}
