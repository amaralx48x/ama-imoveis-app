
'use client'

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { MarketingContent } from "@/lib/data";
import { defaultPrivacyPolicy, defaultTermsOfUse } from "@/lib/data";
import { Search, Share2, Video, Check, X, Mail, Filter, User, Home, ArrowRight, Rss, FileText, CheckCircle } from "lucide-react";
import Image from 'next/image';
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import MarketingHero from '@/components/MarketingHero';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";


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

const FeatureGridItem = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
    <motion.div variants={fadeUpItem} className="flex items-start gap-4">
        <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
            </div>
        </div>
        <div>
            <h4 className="text-lg font-bold text-foreground">{title}</h4>
            <p className="mt-1 text-sm text-foreground/70">{children}</p>
        </div>
    </motion.div>
);


export default function MarketingClientPage({ serverContent }: { serverContent: MarketingContent | null }) {
  const [content, setContent] = useState(serverContent);
  const firestore = useFirestore();

  const marketingRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'marketing', 'content') : null),
    [firestore]
  );
  
  // Usamos `useDoc` para atualizações em tempo real, mas usamos o `serverContent` para a renderização inicial
  const { data: liveContent, isLoading } = useDoc<MarketingContent>(marketingRef);

  useEffect(() => {
    // Atualiza o estado com os dados em tempo real quando eles chegam, se forem diferentes dos dados do servidor
    if (liveContent) {
      setContent(liveContent);
    }
  }, [liveContent]);
  
  useEffect(() => {
    // Theme logic
    const theme = content?.theme || 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [content?.theme]);

  const getImage = (field: keyof Omit<MarketingContent, 'hero_media_type' | 'hero_media_url' | 'feature_video_url' | 'feature_video_title' | 'ctaImageUrl' | 'supportWhatsapp' | 'supportEmail' | 'theme'>, defaultSeed: string) => {
    // @ts-ignore
    const url = content?.[field];
    if (url) return url;
    const placeholder = PlaceHolderImages.find(img => img.id === defaultSeed);
    return placeholder?.imageUrl || `https://picsum.photos/seed/${defaultSeed}/1200/800`;
  };

  if (isLoading && !serverContent) {
    return <LoadingSkeleton />;
  }

  const planDetails = {
    simples: {
      name: 'Simples',
      price: '39,99',
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até 30 imóveis`, included: true },
        { text: '32 Fotos por imóvel', included: true },
        { text: '5 Catálogos de Imóveis (sites extras)', included: true },
        { text: 'Usuário único do Sistema', included: true },
        { text: 'Inteligência Artificial', included: false },
        { text: 'Esteira de Leads', included: false },
        { text: 'Certificado SSL', included: false },
      ],
    },
     essencial: {
      name: 'Essencial',
      price: '74,99',
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até 350 imóveis`, included: true },
        { text: '50 Fotos por Imóvel', included: true },
        { text: '10 Catálogos de Imóveis (sites extras)', included: true },
        { text: '3 Usuários do Sistema', included: true },
        { text: 'Inteligência Artificial', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV', included: true },
      ],
    },
     impulso: {
      name: 'Impulso',
      price: '119,99',
      recommended: true,
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até 1000 imóveis`, included: true },
        { text: '64 Fotos por Imóvel', included: true },
        { text: '20 Catálogos de Imóveis (sites extras)', included: true },
        { text: '5 Usuários do Sistema', included: true },
        { text: 'Inteligência Artificial', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV e XML', included: true },
      ],
    },
    expansao: {
      name: 'Expansão',
      price: '249,99',
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até 3000 imóveis`, included: true },
        { text: '64 Fotos por Imóvel', included: true },
        { text: '40 Catálogos de Imóveis (sites extras)', included: true },
        { text: '15 Usuários do Sistema', included: true },
        { text: 'Inteligência Artificial', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV e XML', included: true },
      ],
    },
  };

  return (
    <div className="min-h-screen text-foreground bg-background">
      {/* NAV */}
      <header className="fixed top-0 z-50 w-full bg-transparent">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-primary">
              <span className="font-bold text-primary-foreground">AMA</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">AMA Imobi</h1>
              <div className="text-xs text-white/50">por AMA Tecnologia</div>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-white">
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
      
        <div className="relative bg-background z-10">
          <div className="container mx-auto px-6 py-20">

             {/* Pricing and Features Section */}
            <section className="py-16">
                 <motion.div 
                    initial="hidden" 
                    whileInView="show" 
                    viewport={{ once: true, amount: 0.3 }} 
                    variants={fadeUpContainer}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                 >
                    {/* Left Side: Title and Features */}
                    <div className="space-y-8">
                        <motion.div variants={fadeUpItem}>
                            <h2 className="text-4xl font-extrabold text-foreground">Site e CRM para imobiliárias e Corretores de Imóveis</h2>
                            <p className="mt-4 text-lg text-foreground/70">Faça um <span className="font-bold">Teste Grátis</span> e supere suas expectativas. Sistema para imobiliárias, CRM Completo e integrado ao Whatsapp.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FeatureGridItem icon={Filter} title="Funil de Vendas">Defina e acompanhe toda jornada de compra do seu cliente.</FeatureGridItem>
                            <FeatureGridItem icon={User} title="Vida do Cliente">Todas as informações de seus clientes em apenas um lugar.</FeatureGridItem>
                            <FeatureGridItem icon={Home} title="Imóveis Compatíveis">A ferramenta ideal para encontrar o imóvel certo para seu cliente.</FeatureGridItem>
                            <FeatureGridItem icon={FileText} title="Gerador de Contratos">Crie diversos contratos preenchendo poucas informações.</FeatureGridItem>
                            <FeatureGridItem icon={Rss} title="Integração com Portais">Integre seus imóveis em diversos portais de imóveis.</FeatureGridItem>
                        </div>
                    </div>

                    {/* Right Side: Price Badge and Details */}
                     <motion.div variants={fadeUpItem} className="flex flex-col items-center lg:items-start">
                        <div className="relative mb-6">
                            <svg className="w-48 h-auto text-yellow-400" viewBox="0 0 160 140" fill="currentColor">
                                <path d="M80 0 L160 35 V105 L80 140 L0 105 V35 Z" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-black">
                                <p className="text-sm font-bold">POR APENAS</p>
                                <p className="font-extrabold">
                                    <span className="text-xl align-top">R$</span>
                                    <span className="text-5xl">39</span>
                                    <span className="text-2xl align-top">,99</span>
                                </p>
                                <p className="text-sm font-bold">/MÊS</p>
                            </div>
                        </div>
                         <div className="space-y-4 text-center lg:text-left">
                            <div className="flex items-center gap-2 text-foreground">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Sem contrato de fidelidade</span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Sem tempo mínimo de permanência</span>
                            </div>

                             <div className="pt-4">
                                <h4 className="font-bold text-lg">Quais são os gastos mensais com a AMA?</h4>
                                <p className="text-sm text-foreground/70">Apenas a mensalidade e nada mais! A AMA possui domínio base para todos os usuários, sem dor de cabeça e gastos desnecessários com domínios.</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Call to Action Section */}
            <section className="py-10 text-center">
                <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUpContainer}>
                    <motion.h3 variants={fadeUpItem} className="text-2xl font-semibold text-foreground/90">
                        Um click diz mais que mil palavras
                    </motion.h3>
                    <motion.div variants={fadeUpItem} className="mt-4">
                        <a href="https://amaimobi.com.br/corretor/4vEISo4pEORjFhv6RzD7eC42cgm2" className={`inline-flex items-center gap-3 px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white text-lg shadow-lg hover:scale-105 transition-transform`}>
                            Clique aqui <ArrowRight className="w-5 h-5" />
                        </a>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features */}
            <section id="features" className="py-10">
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUpContainer}>
                <motion.h3 variants={fadeUpItem} className="text-3xl font-extrabold text-center">Recursos que fazem a diferença</motion.h3>
                <motion.p variants={fadeUpItem} className="mt-3 text-foreground/70 max-w-2xl mx-auto text-center">Tudo que um corretor precisa para anunciar, vender e fidelizar clientes — com simplicidade.</motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {[
                    { t: "Site público por corretor", d: "Página de vendas única para cada corretor, com contato direto e chat." },
                    { t: "CRM integrado", d: "Leads, marcação de visitas, etiquetagem e exportação CSV." },
                    { t: "Painel de métricas", d: "Comissões, visitas, vendas — gráficos por mês." },
                  ].map((f, i) => (
                    <motion.div variants={fadeUpItem} key={i} className="p-6 rounded-lg bg-card/50 border border-border/10">
                      <div className="font-semibold text-lg">{f.t}</div>
                      <p className="mt-2 text-sm text-foreground/70">{f.d}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* Image gallery + social proof */}
            <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
               <div className="relative h-80 lg:h-96">
                  <motion.div initial={{ opacity: 0, x: -20, rotate: -5 }} whileInView={{ opacity: 1, x: 0, rotate: -8 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="absolute top-0 left-0 w-3/4 rounded-lg overflow-hidden shadow-lg border border-border/10">
                    <Image src={getImage('section2_image', "property-1-2")} alt="Visão do painel" width={1200} height={800} className="object-cover" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20, rotate: 5 }} whileInView={{ opacity: 1, x: 0, rotate: 2 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="absolute bottom-0 right-0 w-3/4 rounded-lg overflow-hidden shadow-2xl border border-border/10">
                    <Image src={getImage('section4_image1', "property-2-2")} alt="Detalhe do painel" width={600} height={400} className="object-cover" />
                  </motion.div>
              </div>
              <div className="p-6 rounded-xl bg-card/50 border border-border/10 h-full flex flex-col justify-center">
                <h4 className="font-bold text-lg">Seu Centro de Comando para o Sucesso</h4>
                <p className="mt-4 text-sm text-foreground/70">
                  Nosso painel de controle é mais do que uma ferramenta — é o seu assistente pessoal. Criado com um design limpo e intuitivo, ele elimina a complexidade e permite que você se concentre no que realmente importa: vender imóveis e encantar clientes. Gerencie seu portfólio completo, responda a leads com agilidade, agende visitas e acompanhe seu desempenho financeiro com gráficos claros, tudo em um só lugar. Menos tempo com planilhas, mais tempo fechando negócios.
                </p>
              </div>
            </section>

            {/* Duplicated and Inverted Section */}
            <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
              <div className="p-6 rounded-xl bg-card/50 border border-border/10 h-full flex flex-col justify-center lg:order-last">
                <h4 className="font-bold text-lg">Sua Vitrine Online, Pronta em Minutos</h4>
                <p className="mt-4 text-sm text-foreground/70">
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
                <motion.p variants={fadeUpItem} className="mt-3 text-foreground/70 max-w-2xl mx-auto text-center">Ferramentas pensadas para agilizar seu trabalho e ampliar seu alcance.</motion.p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  {[
                    { t: "Importação em Massa", d: "Suba dezenas de imóveis de uma vez com nossa importação de arquivos CSV." },
                    { t: "Controle de Seções", d: "Crie e organize seções personalizadas, como 'Oportunidades' ou 'Alto Padrão'." },
                    { t: "Agendamento de Visitas", d: "Receba solicitações de visita com data e horário direto no seu painel de leads." },
                  ].map((f, i) => (
                    <motion.div variants={fadeUpItem} key={i} className="p-6 rounded-lg bg-card/50 border border-border/10">
                      <div className="font-semibold text-lg">{f.t}</div>
                      <p className="mt-2 text-sm text-foreground/70">{f.d}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>
            
            {/* Video Section */}
            <section className="mt-16 py-10">
                <div className="relative rounded-xl border border-border/10 aspect-video overflow-hidden shadow-lg h-full flex items-center justify-center">
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
                        <div className="text-center text-foreground/50 flex flex-col items-center gap-2">
                           <Video className="w-10 h-10"/>
                           <span>Vídeo de Demonstração</span>
                        </div>
                    )}
                    <div className="relative z-10 text-center">
                        
                    </div>
                </div>
            </section>

            {/* SEO Section */}
            <section className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-10">
                <div className="p-6 rounded-xl bg-card/50 border border-border/10 h-full flex flex-col justify-center">
                    <h4 className="font-bold text-lg flex items-center gap-2"><Search className="text-primary w-5 h-5"/> Visibilidade no Google e Redes Sociais</h4>
                    <p className="mt-4 text-sm text-foreground/70">
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
              <p className="mt-2 text-foreground/70 text-center">Teste 7 dias grátis. Depois, escolha seu plano.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {Object.values(planDetails).map((p) => (
                        <motion.div 
                            key={p.name} 
                            variants={fadeUpItem} 
                            initial="hidden" 
                            whileInView="show" 
                            viewport={{ once: true }} 
                            className={cn('flex flex-col p-6 rounded-2xl border border-border/10 bg-card/50 shadow-lg relative', p.recommended && 'border-2 border-blue-500')}
                        >
                            {p.recommended && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-fit px-4 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3" /> RECOMENDADO
                                </div>
                            )}
                            <div className="flex-grow">
                                <h4 className="text-lg font-bold">{p.name}</h4>
                                <div className="my-4">
                                    <span className="text-4xl font-extrabold">R$ {p.price}</span>
                                    <span className="text-sm text-foreground/60">/mês</span>
                                </div>
                                <ul className="space-y-3 text-sm">
                                    {p.features.map(feat => (
                                        <PlanFeature key={feat.text} included={feat.included}>{feat.text}</PlanFeature>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-8">
                                <Link href="/login" className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white px-4 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity">
                                    TESTE GRÁTIS
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="mt-20 mb-24 text-center">
              <div className="mx-auto max-w-2xl p-8 rounded-2xl border border-border/10 bg-gradient-to-b from-card/40 to-card/20">
                <h3 className="text-2xl font-bold">Teste AMA Imobi por 7 dias — grátis</h3>
                <p className="mt-2 text-foreground/70">Sem cartão no teste — experimente e veja o impacto nas suas vendas.</p>
                <div className="mt-6 flex justify-center gap-4">
                  <Link href="/login" className={`inline-flex bg-gradient-to-r from-primary via-accent to-[#B794F4] text-white px-6 py-3 rounded-lg font-semibold`}>Começar 7 dias grátis</Link>
                  <a href="#plans" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border/10">Ver planos</a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/10 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-foreground/60">© {new Date().getFullYear()} AMA Tecnologia — AMA Imobi</div>
          <div className="flex items-center gap-4 text-foreground/60">
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
