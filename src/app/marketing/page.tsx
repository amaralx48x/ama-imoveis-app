'use client'

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/layout/header";

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

export default function MarketingPage() {
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
      <main className="container mx-auto px-6 py-20">
        <motion.section initial="hidden" whileInView="show" viewport={{ once: true }} variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight">
              A plataforma completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#A78BFA]">corretores e imobiliárias</span>
            </h2>

            <p className="mt-6 text-lg text-white/70 max-w-xl">
              Gerencie anúncios, leads, visitas e comissões — tudo num só lugar. Painéis inteligentes, agenda integrada e site público para cada corretor.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={`inline-flex items-center gap-3 px-6 py-3 rounded-lg font-semibold ${neon} text-white shadow-lg hover:scale-[1.02] transition`}>
                Iniciar 7 dias grátis
              </Link>

              <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition">
                Conhecer recursos
              </a>
            </div>

            <div className="mt-8 flex gap-6">
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

          {/* Mockup / imagem */}
          <motion.div variants={fadeUp} className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/6">
              <Image
                src="https://picsum.photos/seed/mockup/900/600"
                alt="Mockup AMA Imobi"
                width={900}
                height={600}
                className="object-cover w-full h-full"
                priority
                data-ai-hint="dashboard screen"
              />
            </div>

            {/* Floating card */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="absolute left-6 bottom-6 bg-gradient-to-r from-black/70 to-white/5 border border-white/6 p-4 rounded-xl backdrop-blur-sm w-72 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/60">Imóvel</div>
                  <div className="font-semibold">Casa térrea — 3 quartos</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white/70">R$ 420.000</div>
                  <div className="text-xs text-white/50">Venda</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Features */}
        <section id="features" className="mt-20 py-10">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={container}>
            <motion.h3 variants={fadeUp} className="text-3xl font-extrabold text-center">Recursos que fazem a diferença</motion.h3>
            <motion.p variants={fadeUp} className="mt-3 text-white/70 max-w-2xl mx-auto text-center">Tudo que um corretor precisa para anunciar, vender e fidelizar clientes — com simplicidade.</motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { t: "Site público por corretor", d: "Página de vendas única para cada corretor, com contato direto e chat." },
                { t: "CRM integrado", d: "Leads, marcação de visitas, etiquetagem e exportação CSV." },
                { t: "Painel de métricas", d: "Comissões, visitas, vendas — gráficos por mês." },
              ].map((f, i) => (
                <motion.div variants={fadeUp} key={i} className="p-6 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-semibold text-lg">{f.t}</div>
                  <p className="mt-2 text-sm text-white/70">{f.d}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Image gallery + social proof */}
        <section className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start py-10">
          <div className="lg:col-span-2 rounded-xl overflow-hidden shadow-lg">
            <Image src="https://picsum.photos/seed/gallery/1200/600" alt="Galeria" width={1200} height={600} className="object-cover w-full h-72" data-ai-hint="dashboard chart" />
          </div>

          <div className="p-6 rounded-xl bg-white/5 border border-white/10 h-full flex flex-col justify-center">
            <h4 className="font-bold text-lg">Depoimentos</h4>
            <p className="mt-4 text-sm text-white/70">“O AMA Imobi transformou nosso fluxo de leads — mais visitas agendadas e vendas concluídas.”</p>
            <div className="mt-4 font-semibold">— Corretor Fulano, RJ</div>
          </div>
        </section>

        {/* Plans & CTA */}
        <section id="plans" className="mt-20 py-10">
          <motion.h3 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-3xl font-extrabold text-center">Planos</motion.h3>
          <p className="mt-2 text-white/70 text-center">Teste 7 dias grátis. Depois, escolha seu plano.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg">
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

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="p-6 rounded-2xl border border-primary bg-primary/10 shadow-lg">
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
