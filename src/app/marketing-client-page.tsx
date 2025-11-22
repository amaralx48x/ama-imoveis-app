
'use client'

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { MarketingContent } from "@/lib/data";
import { Search, Share2 } from "lucide-react";
import Image from 'next/image';

const neon = "bg-gradient-to-r from-primary via-accent to-[#B794F4]";

// --- Início do Novo Componente Hero (Reconstruído) ---
interface HeroProps {
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

function MarketingHero({ content }: HeroProps) {
  const mediaUrl = content?.hero_media_url;
  const mediaType = content?.hero_media_type;

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center text-white text-center py-20 px-6 overflow-hidden">
      
      {/* --- BACKGROUND (Renderizado no Servidor para evitar piscar) --- */}
      <div className="absolute inset-0 -z-20 bg-black">
        {mediaUrl ? (
          <>
            {mediaType === 'video' ? (
              <video
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
        ) : (
           // Fallback se não houver mídia, um fundo escuro sólido
          <div className="absolute inset-0 bg-gray-900" />
        )}
      </div>

      {/* --- CONTEÚDO DE TEXTO (Animado no Cliente) --- */}
      <motion.div 
        variants={fadeUpContainer}
        initial="hidden"
        animate="show"
        className="max-w-3xl z-10"
      >
        <motion.h2 variants={fadeUpItem} className="text-4xl md:text-5xl font-extrabold leading-tight">
          A plataforma completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA]">corretores e imobiliárias</span>
        </motion.h2>

        <motion.p variants={fadeUpItem} className="mt-6 text-lg text-white/70">
          Gerencie anúncios, leads, visitas e comissões — tudo num só lugar. Painéis inteligentes, agenda integrada e site público para cada corretor.
        </motion.p>

        <motion.div variants={fadeUpItem} className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link href="/login" className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold ${neon} text-white shadow-lg hover:scale-[1.02] transition`}>
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
// --- Fim do Novo Componente Hero ---


export default function MarketingClientPage() {
  const firestore = useFirestore();
  const marketingRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "marketing", "content") : null),
    [firestore]
  );
  const { data: marketingData, isLoading } = useDoc<MarketingContent>(marketingRef);

  const getImage = (field: keyof MarketingContent, defaultUrl: string) => {
    if (isLoading) return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    // @ts-ignore
    return marketingData?.[field] || defaultUrl;
  };


  return (
    <div className="min-h-screen text-white bg-black">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-white/6 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-primary">
              <span className="font-bold">AMA</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold">AMA Imobi</h1>
              <div className="text-xs text-white/50">por AMA Tecnologia</div>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <a href="#features" className="text-sm hover:text-white/90">Recursos</a>
            <a href="#plans" className="text-sm hover:text-white/90">Planos</a>
            <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-white/10 hover:scale-105 transition">
              Área do Corretor
            </Link>
          </nav>
        </div>
      </header>
      
      {/* HERO */}
      <MarketingHero content={marketingData} />

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-20">
        
        {/* Call to Action Section */}
        <section className="py-10 text-center">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUpContainer}>
                <motion.h3 variants={fadeUpItem} className="text-2xl font-semibold text-white/90">
                    Um click fala mais que mil palavras
                </motion.h3>
                <motion.div variants={fadeUpItem} className="mt-4">
                    <a href="https://studio--ama-imveis-041125-945215-63275.us-central1.hosted.app/corretor/4vEISo4pEORjFhv6RzD7eC42cgm2" className={`inline-flex items-center gap-3 px-8 py-4 rounded-lg font-semibold ${neon} text-white text-lg shadow-lg hover:scale-105 transition-transform`}>
                        Clique aqui
                    </a>
                </motion.div>
                <motion.p variants={fadeUpItem} className="mt-3 text-white/70">
                    veja um site simples e profissional
                </motion.p>
            </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="py-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUpContainer}>
            <motion.h3 variants={fadeUpItem} className="text-3xl font-extrabold text-center">Recursos que fazem a diferença</motion.h3>
            <motion.p variants={fadeUpItem} className="mt-3 text-white/70 max-w-2xl mx-auto text-center">Tudo que um corretor precisa para anunciar, vender e fidelizar clientes — com simplicidade.</motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { t: "Site público por corretor", d: "Página de vendas única para cada corretor, com contato direto e chat." },
                { t: "CRM integrado", d: "Leads, marcação de visitas, etiquetagem e exportação CSV." },
                { t: "Painel de métricas", d: "Comissões, visitas, vendas — gráficos por mês." },
              ].map((f, i) => (
                <motion.div variants={fadeUpItem} key={i} className="p-6 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-semibold text-lg">{f.t}</div>
                  <p className="mt-2 text-sm text-white/70">{f.d}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Image gallery + social proof */}
        <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
           <div className="relative h-80 lg:h-96">
              <motion.div initial={{ opacity: 0, x: -20, rotate: -5 }} whileInView={{ opacity: 1, x: 0, rotate: -8 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="absolute top-0 left-0 w-3/4 rounded-lg overflow-hidden shadow-lg border border-white/10">
                  <React.Suspense fallback={<div className="w-full h-full bg-muted animate-pulse"></div>}>
                    <img src={getImage('section2_image', "https://picsum.photos/seed/page1/1200/800")} alt="Visão do painel" width={1200} height={800} className="object-cover" />
                  </React.Suspense>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20, rotate: 5 }} whileInView={{ opacity: 1, x: 0, rotate: 2 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="absolute bottom-0 right-0 w-3/4 rounded-lg overflow-hidden shadow-2xl border border-white/10">
                   <React.Suspense fallback={<div className="w-full h-full bg-muted animate-pulse"></div>}>
                    <img src={getImage('section4_image1', "https://picsum.photos/seed/page2/600/400")} alt="Detalhe do painel" width={600} height={400} className="object-cover" />
                  </React.Suspense>
              </motion.div>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 h-full flex flex-col justify-center">
            <h4 className="font-bold text-lg">Seu Centro de Comando para o Sucesso</h4>
            <p className="mt-4 text-sm text-white/70">
              Nosso painel de controle é mais do que uma ferramenta — é o seu assistente pessoal. Criado com um design limpo e intuitivo, ele elimina a complexidade e permite que você se concentre no que realmente importa: vender imóveis e encantar clientes. Gerencie seu portfólio completo, responda a leads com agilidade, agende visitas e acompanhe seu desempenho financeiro com gráficos claros, tudo em um só lugar. Menos tempo com planilhas, mais tempo fechando negócios.
            </p>
          </div>
        </section>

        {/* Duplicated and Inverted Section */}
        <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10 h-full flex flex-col justify-center lg:order-last">
            <h4 className="font-bold text-lg">Sua Vitrine Online, Pronta em Minutos</h4>
            <p className="mt-4 text-sm text-white/70">
              Cada corretor recebe um site público, elegante e otimizado para dispositivos móveis, sem custo adicional. Apresente seus imóveis em destaque, compartilhe suas informações de contato e receba avaliações de clientes. É a sua marca pessoal na internet, pronta para capturar leads e construir sua reputação online, 24 horas por dia, 7 dias por semana.
            </p>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg h-full lg:order-first aspect-[4/3]">
            <React.Suspense fallback={<div className="w-full h-full bg-muted animate-pulse"></div>}>
                <img 
                    src={getImage('section3_image', "https://picsum.photos/seed/agent-site/1200/800")} 
                    alt="Site público do corretor" 
                    width={1200} height={900} 
                    className="object-cover w-full h-full" 
                    data-ai-hint="real estate website" />
             </React.Suspense>
          </div>
        </section>

        {/* Additional Features Section */}
        <section className="mt-20 py-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUpContainer}>
            <motion.h3 variants={fadeUpItem} className="text-3xl font-extrabold text-center">Recursos Adicionais Poderosos</motion.h3>
            <motion.p variants={fadeUpItem} className="mt-3 text-white/70 max-w-2xl mx-auto text-center">Ferramentas pensadas para agilizar seu trabalho e ampliar seu alcance.</motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { t: "Importação em Massa", d: "Suba dezenas de imóveis de uma vez com nossa importação de arquivos CSV." },
                { t: "Controle de Seções", d: "Crie e organize seções personalizadas, como 'Oportunidades' ou 'Alto Padrão'." },
                { t: "Agendamento de Visitas", d: "Receba solicitações de visita com data e horário direto no seu painel de leads." },
              ].map((f, i) => (
                <motion.div variants={fadeUpItem} key={i} className="p-6 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-semibold text-lg">{f.t}</div>
                  <p className="mt-2 text-sm text-white/70">{f.d}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* SEO Section */}
        <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 h-full flex flex-col justify-center">
                <h4 className="font-bold text-lg flex items-center gap-2"><Search className="text-primary w-5 h-5"/> Visibilidade no Google e Redes Sociais</h4>
                <p className="mt-4 text-sm text-white/70">
                    Sua página pública é automaticamente otimizada para os motores de busca. Com nosso painel de SEO, você controla o título, descrição e imagem que aparecem no Google e ao compartilhar seu link. Garanta uma apresentação profissional e atraia mais clientes.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                    <p className="flex items-center gap-2 text-white/80"><Share2 className="w-4 h-4 text-primary"/> Tags Open Graph para compartilhamento</p>
                    <p className="flex items-center gap-2 text-white/80"><Search className="w-4 h-4 text-primary"/> Metadados para o Google</p>
                </div>
            </div>
             <div className="rounded-xl overflow-hidden shadow-lg h-full aspect-video">
                <React.Suspense fallback={<div className="w-full h-full bg-muted animate-pulse"></div>}>
                    <img 
                        src={getImage('section6_image', "https://picsum.photos/seed/seo-example/1200/630")} 
                        alt="Exemplo de SEO" 
                        width={1200} height={630} 
                        className="object-cover w-full h-full" 
                        data-ai-hint="search engine optimization" />
                </React.Suspense>
            </div>
        </section>


        {/* Plans & CTA */}
        <section id="plans" className="mt-20 py-10">
          <motion.h3 variants={fadeUpItem} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-3xl font-extrabold text-center">Planos</motion.h3>
          <p className="mt-2 text-white/70 text-center">Teste 7 dias grátis. Depois, escolha seu plano.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div variants={fadeUpItem} initial="hidden" whileInView="show" viewport={{ once: true }} className="p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">Corretor Plus</div>
                  <div className="text-xs text-white/60">Para profissionais solo</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold">R$ 59,90</div>
                  <div className="text-xs text-white/60">por mês</div>
                </div>
              </div>
              <ul className="mt-4 text-sm text-white/70 space-y-2">
                <li>✅ Gestão de imóveis</li>
                <li>✅ CRM e leads</li>
                <li>❌ Import CSV (restrito)</li>
              </ul>
              <div className="mt-6">
                <Link href="/login" className={`inline-flex ${neon} text-white px-4 py-2 rounded-md font-medium`}>Iniciar 7 dias</Link>
              </div>
            </motion.div>

            <motion.div variants={fadeUpItem} initial="hidden" whileInView="show" viewport={{ once: true }} className="p-6 rounded-2xl border border-primary bg-primary/10 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">Imobiliária Plus</div>
                  <div className="text-xs text-white/60">Para equipes e imobiliárias</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold">R$ 89,90</div>
                  <div className="text-xs text-white/60">por mês</div>
                </div>
              </div>
              <ul className="mt-4 text-sm text-white/70 space-y-2">
                <li>✅ Import CSV</li>
                <li>✅ Limite maior de anúncios</li>
                <li>✅ Controle multiusuário</li>
              </ul>
              <div className="mt-6">
                <Link href="/login" className={`inline-flex ${neon} text-white px-4 py-2 rounded-md font-medium`}>Iniciar 7 dias</Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-20 mb-24 text-center">
          <div className="mx-auto max-w-2xl p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-black/40 to-black/20">
            <h3 className="text-2xl font-bold">Teste AMA Imobi por 7 dias — grátis</h3>
            <p className="mt-2 text-white/70">Sem cartão no teste — experimente e veja o impacto nas suas vendas.</p>
            <div className="mt-6 flex justify-center gap-4">
              <Link href="/login" className={`inline-flex ${neon} text-white px-6 py-3 rounded-lg font-semibold`}>Começar 7 dias grátis</Link>
              <Link href="#plans" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10">Ver planos</Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/60">© {new Date().getFullYear()} AMA Tecnologia — AMA Imobi</div>
          <div className="flex items-center gap-3 text-white/60">
            <a href="#" className="text-sm hover:text-white">Termos</a>
            <a href="#" className="text-sm hover:text-white">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
