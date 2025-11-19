
'use client';

import { MarketingContent } from '@/lib/data';
import { motion } from 'framer-motion';

interface MarketingHeroProps {
  content?: MarketingContent | null;
}

export function MarketingHero({ content }: MarketingHeroProps) {
  const mediaUrl = content?.feature_video_url;

  if (!mediaUrl) return null; // Don't render the section if there's no video

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden my-16 rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10"
    >
      <video
        key={mediaUrl}
        src={`${mediaUrl}${mediaUrl.includes("?") ? "" : "?alt=media"}`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        onError={(e) => console.error("Erro ao carregar o vídeo:", e)}
      />
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          Sua Vitrine Digital, Nossa Tecnologia
        </h3>
        <p className="text-white mt-3 text-lg md:text-xl max-w-2xl">
          Transformamos sua expertise em uma experiência online que cativa e converte.
        </p>
      </div>
    </motion.section>
  );
}
