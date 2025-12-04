
import type { Metadata } from 'next';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import type { MarketingContent } from '@/lib/data';
import { getSEO } from '@/firebase/server-actions/seo';
import { MarketingHero } from '@/components/marketing-hero';
import MarketingClientPage from './marketing-client-page';


async function getMarketingPageContent(): Promise<MarketingContent | null> {
  try {
    const { firestore } = getFirebaseServer();
    const contentRef = doc(firestore, 'marketing', 'content');
    const contentSnap = await getDoc(contentRef);

    if (contentSnap.exists()) {
      return JSON.parse(JSON.stringify(contentSnap.data())) as MarketingContent;
    }
  } catch (error) {
    console.error("Failed to fetch marketing content on server:", error);
  }
  return null;
}

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

export default async function MarketingPage() {
  const content = await getMarketingPageContent();
  return <MarketingClientPage serverContent={content} />;
}
