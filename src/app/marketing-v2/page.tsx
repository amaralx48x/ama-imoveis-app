
import type { Metadata } from 'next';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import type { MarketingContent } from '@/lib/data';
import { getSEO } from '@/firebase/server-actions/seo';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import MarketingHero from '@/components/MarketingHero';

// Função para buscar o conteúdo da página de marketing no servidor
async function getMarketingPageContent() {
  try {
    const { firestore } = getFirebaseServer();
    const contentRef = doc(firestore, 'marketing', 'content');
    const contentSnap = await getDoc(contentRef);

    if (contentSnap.exists()) {
      // Retorna os dados como um objeto simples para evitar problemas de serialização
      return JSON.parse(JSON.stringify(contentSnap.data())) as MarketingContent;
    }
  } catch (error) {
    console.error("Failed to fetch marketing content on server:", error);
  }
  // Retorna null se não encontrar ou der erro
  return null;
}

// Gera os metadados (SEO) para a página
export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSEO("homepage");
  const title = seoData?.title || 'AMA Imóveis - A Plataforma para Corretores';
  const description = seoData?.description || 'Gerencie anúncios, leads e comissões em um só lugar.';
  const imageUrl = seoData?.image || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// O componente da página (Server Component)
export default async function MarketingV2Page() {
  // Busca o conteúdo no servidor antes de renderizar a página
  const content = await getMarketingPageContent();

  return (
    <div className="min-h-screen text-white bg-black">
      <Header agentName="AMA Imóveis" />
      <main>
        {/* O componente Hero recebe o conteúdo diretamente, evitando erros de hidratação */}
        <MarketingHero content={content} />
        
        {/* Seção de placeholder para conteúdo futuro */}
        <div className="py-20 text-center">
          <h2 className="text-3xl font-bold">Mais conteúdo virá aqui</h2>
          <p className="text-white/70 mt-2">Esta é uma página de marketing limpa e funcional.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
