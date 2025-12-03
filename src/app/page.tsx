
import type { Metadata } from 'next';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import type { MarketingContent } from '@/lib/data';
import { getSEO } from '@/firebase/server-actions/seo';
import MarketingClientPage from "./marketing-client-page";

// Função para buscar o conteúdo da página de marketing no servidor
async function getMarketingPageContent(): Promise<MarketingContent | null> {
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

/**
 * Este é o ponto de entrada principal para a rota '/'.
 * Ele busca os dados de conteúdo no servidor e os passa para o componente cliente,
 * garantindo uma renderização inicial correta e sem erros de hidratação.
 */
export default async function MarketingPage() {
  const content = await getMarketingPageContent();
  
  // Passa o conteúdo para o componente cliente, que cuidará da renderização.
  return <MarketingClientPage serverContent={content} />;
}
