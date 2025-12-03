
'use client';

import { MarketingContent } from '@/lib/data';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
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
  // Determine a mídia a ser usada, com fallback para uma imagem padrão.
  const defaultHeroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
  const mediaUrl = content?.hero_media_url || defaultHeroImage?.imageUrl;
  const mediaType = mediaUrl ? (content?.hero_media_type || 'image') : 'image';

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center text-white text-center py-20 px-6 overflow-hidden">
      
      {/* --- BACKGROUND (Renderizado no servidor, carrega instantaneamente) --- */}
      <div className="absolute inset-0 -z-20 bg-black">
        {mediaUrl && (
          <>
            {mediaType === 'video' ? (
              <video
                key={mediaUrl} // A chave ajuda o React a diferenciar se a URL mudar
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
                priority // Crucial para LCP (Largest Contentful Paint)
                className="object-cover brightness-50"
                sizes="100vw"
              />
            )}
          </>
        )}
      </div>

      {/* --- CONTEÚDO DE TEXTO (Anima no cliente) --- */}
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
          <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition">
            Conhecer recursos
          </a>
        </motion.div>

        <motion.div variants={fadeUpItem} className="mt-8 flex gap-6 justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white/5">
              ⭐
            </div>
            <div className="text-left">
              <div className="font-semibold">Avaliações reais</div>
              <div className="text-xs text-white/60">Mais de 4.8 de satisfação</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center bg-white/5">
              🔒
            </div>
            <div className="text-left">
              <div className="font-semibold">Segurança</div>
              <div className="text-xs text-white/60">Dados criptografados</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default MarketingHero
