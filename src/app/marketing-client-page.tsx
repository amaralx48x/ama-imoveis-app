
'use client'

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { MarketingContent } from "@/lib/data";
import { defaultPrivacyPolicy, defaultTermsOfUse } from "@/lib/data";
import { Search, Share2, Video, Check, X, Mail } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import MarketingHero from '@/components/MarketingHero';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";


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

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-sm">
         <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-24" />
        </div>
      </header>
      <main>
        <section className="relative min-h-[70vh] flex items-center justify-center">
            <Skeleton className="w-full h-full absolute inset-0"/>
            <div className="z-10 text-center flex flex-col items-center">
                <Skeleton className="h-12 w-96 mb-4" />
                <Skeleton className="h-6 w-80" />
            </div>
        </section>
      </main>
    </div>
  )
}

const PlanFeature = ({ children, included }: { children: React.ReactNode, included: boolean }) => (
    <li className={`flex items-start gap-3 ${!included ? 'text-white/50' : ''}`}>
        {included ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
        <span>{children}</span>
    </li>
);

function PolicyDialog({ title, content, companyName }: { title: string, content: string, companyName: string }) {
    const formattedContent = content.replace(/\[Nome do Site\/Corretor\]/g, companyName);
    
    const formatText = (text: string) => {
        return text
            .split('\n')
            .map((line, i) => {
                if (line.startsWith('## ')) return `<h2 key=${i} class="text-2xl font-bold mt-6 mb-3">${line.substring(3)}</h2>`;
                if (line.startsWith('**')) return `<p key=${i} class="font-bold mt-4">${line.replace(/\*\*/g, '')}</p>`;
                if (line.trim() === '') return '<br />';
                return `<p key=${i} class="text-muted-foreground leading-relaxed mb-2">${line}</p>`;
            })
            .join('');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                 <button className="text-sm hover:text-white transition-colors">{title}</button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh] text-white bg-black border-white/20">
                 <DialogHeader>
                    <DialogTitle className="text-3xl font-headline">{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full pr-6">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatText(formattedContent) }} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export default function MarketingClientPage() {
  const firestore = useFirestore();
  const marketingRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'marketing', 'content') : null),
    [firestore]
  );
  const { data: content, isLoading } = useDoc<MarketingContent>(marketingRef);
  
  const getImage = (field: keyof Omit<MarketingContent, 'hero_media_type' | 'hero_media_url' | 'feature_video_url' | 'feature_video_title' | 'ctaImageUrl' | 'supportWhatsapp'>, defaultSeed: string) => {
    // @ts-ignore
    const url = content?.[field];
    if (url) return url;
    const placeholder = PlaceHolderImages.find(img => img.id === defaultSeed);
    return placeholder?.imageUrl || `https://picsum.photos/seed/${defaultSeed}/1200/800`;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen text-white bg-black">
      {/* NAV */}
      <header className="fixed top-0 z-50 w-full bg-transparent">
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
      
      <main className="relative">
        <MarketingHero content={content} />
      
        <div className="relative bg-black z-10">
          <div className="container mx-auto px-6 py-20">
            {/* Call to Action Section */}
            <section className="py-10 text-center">
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUpContainer}>
                    <motion.h3 variants={fadeUpItem} className="text-2xl font-semibold text-white/90">
                        Um click fala mais que mil palavras
                    </motion.h3>
                    <motion.div variants={fadeUpItem} className="mt-4">
                        <a href="https://studio--ama-imveis-041125-945215-63275.us-central1.hosted.app/corretor/4vEISo4pEORjFhv6RzD7eC42cgm2" className={`inline-flex items-center gap-3 px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white text-lg shadow-lg hover:scale-105 transition-transform`}>
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
                    <Image src={getImage('section2_image', "property-1-2")} alt="Visão do painel" width={1200} height={800} className="object-cover" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20, rotate: 5 }} whileInView={{ opacity: 1, x: 0, rotate: 2 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="absolute bottom-0 right-0 w-3/4 rounded-lg overflow-hidden shadow-2xl border border-white/10">
                    <Image src={getImage('section4_image1', "property-2-2")} alt="Detalhe do painel" width={600} height={400} className="object-cover" />
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
                <Image 
                    src={getImage('section3_image', "agent-photo")} 
                    alt="Site público do corretor" 
                    width={1200} height={900} 
                    className="object-cover w-full h-full" 
                    data-ai-hint="real estate website" />
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
            
            {/* Video Section */}
            <section className="mt-16 py-10">
                <div className="relative rounded-xl border border-white/10 aspect-video overflow-hidden shadow-lg h-full flex items-center justify-center">
                    {content?.feature_video_url ? (
                        <video 
                            src={content.feature_video_url} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="text-center text-white/50 flex flex-col items-center gap-2">
                           <Video className="w-10 h-10"/>
                           <span>Vídeo de Demonstração</span>
                        </div>
                    )}
                    <div className="relative z-10 text-center">
                        <h4 className="font-extrabold text-4xl text-gradient drop-shadow-lg">{content?.feature_video_title || "Veja a Plataforma em Ação"}</h4>
                    </div>
                </div>
            </section>

            {/* SEO Section */}
            <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 h-full flex flex-col justify-center">
                    <h4 className="font-bold text-lg flex items-center gap-2"><Search className="text-primary w-5 h-5"/> Visibilidade no Google e Redes Sociais</h4>
                    <p className="mt-4 text-sm text-white/70">
                        Sua página pública é automaticamente otimizada para os motores de busca. Com nosso painel de SEO, você controla o título, descrição e imagem que aparecem no Google e ao compartilhar seu link. Garanta uma apresentação profissional e atraia mais clientes.
                    </p>
                </div>
                 <div className="rounded-xl overflow-hidden shadow-lg h-full aspect-video">
                    <Image 
                        src={getImage('section6_image', "property-3-1")} 
                        alt="Exemplo de SEO" 
                        width={1200} height={630} 
                        className="object-cover w-full h-full" 
                        data-ai-hint="search engine optimization" />
                </div>
            </section>


            {/* Plans & CTA */}
            <section id="plans" className="mt-20 py-10">
              <motion.h3 variants={fadeUpItem} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-3xl font-extrabold text-center">Planos</motion.h3>
              <p className="mt-2 text-white/70 text-center">Teste 7 dias grátis. Depois, escolha seu plano.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* AMAPLUS Plan */}
                    <motion.div variants={fadeUpItem} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg">
                        <div className="flex-grow">
                            <h4 className="text-lg font-bold">AMAPLUS</h4>
                            <p className="text-sm text-white/60 mb-4">Para corretores individuais</p>
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold">R$ 39,90</span>
                                <span className="text-sm text-white/60">/mês</span>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <PlanFeature included={true}>Site profissional personalizável</PlanFeature>
                                <PlanFeature included={true}>Painel de controle</PlanFeature>
                                <PlanFeature included={true}>CRM completo</PlanFeature>
                                <PlanFeature included={true}>SEO (Otimização para Google)</PlanFeature>
                                <PlanFeature included={true}>Lista de captação de leads</PlanFeature>
                                <PlanFeature included={true}>Até 50 imóveis simultâneos</PlanFeature>
                                <PlanFeature included={true}>5 GB de dados por mês</PlanFeature>
                                <PlanFeature included={true}>Domínio pago à parte (R$ 40/anual)</PlanFeature>
                                <PlanFeature included={false}>Importar lista de imóveis por CSV</PlanFeature>
                                <PlanFeature included={false}>Atendimento prioritário técnico</PlanFeature>
                            </ul>
                        </div>
                        <div className="mt-8">
                            <Link href="/login" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white px-4 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity">
                                Iniciar 7 dias
                            </Link>
                        </div>
                    </motion.div>

                    {/* AMA ULTRA Plan */}
                    <motion.div variants={fadeUpItem} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-col p-6 rounded-2xl border-2 border-primary bg-primary/10 shadow-lg">
                         <div className="flex-grow">
                            <h4 className="text-lg font-bold">AMA ULTRA</h4>
                            <p className="text-sm text-white/60 mb-4">Para equipes e imobiliárias</p>
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold">R$ 59,90</span>
                                <span className="text-sm text-white/60">/mês</span>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <PlanFeature included={true}>Site profissional personalizável</PlanFeature>
                                <PlanFeature included={true}>Painel de controle</PlanFeature>
                                <PlanFeature included={true}>CRM completo</PlanFeature>
                                <PlanFeature included={true}>SEO (Otimização para Google)</PlanFeature>
                                <PlanFeature included={true}>Lista de captação de leads</PlanFeature>
                                <PlanFeature included={true}>Até 300 imóveis cadastrados</PlanFeature>
                                <PlanFeature included={true}>10 GB de dados por mês</PlanFeature>
                                <PlanFeature included={true}>Importar lista de imóveis por CSV</PlanFeature>
                                <PlanFeature included={true}>Domínio personalizado de graça</PlanFeature>
                                <PlanFeature included={true}>Atendimento prioritário técnico</PlanFeature>
                            </ul>
                        </div>
                        <div className="mt-8">
                            <Link href="/login" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white px-4 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity">
                                Iniciar 7 dias
                            </Link>
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
                  <Link href="/login" className={`inline-flex bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white px-6 py-3 rounded-lg font-semibold`}>Começar 7 dias grátis</Link>
                  <Link href="#plans" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10">Ver planos</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/60">© {new Date().getFullYear()} AMA Tecnologia — AMA Imobi</div>
          <div className="flex items-center gap-4 text-white/60">
              <PolicyDialog title="Termos de Uso" content={defaultTermsOfUse} companyName="AMA Tecnologia" />
              <PolicyDialog title="Política de Privacidade" content={defaultPrivacyPolicy} companyName="AMA Tecnologia" />
              {content?.supportEmail && (
                <a href={`mailto:${content.supportEmail}`} className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  {content.supportEmail}
                </a>
              )}
          </div>
        </div>
      </footer>
    </div>
  );
}

    