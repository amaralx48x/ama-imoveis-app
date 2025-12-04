
import type { Metadata } from 'next';
import { getSEO } from '@/firebase/server-actions/seo';
import MarketingClientPage from "./marketing-client-page";
import { PlaceHolderImages } from '@/lib/placeholder-images';

// A página de marketing agora não busca mais dados do Firestore.
// Ela obtém o conteúdo diretamente de um arquivo estático para garantir consistência.
function getMarketingPageContent() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
  const section2Image = PlaceHolderImages.find(img => img.id === 'property-1-2');
  const section3Image = PlaceHolderImages.find(img => img.id === 'agent-photo');
  const section4Image1 = PlaceHolderImages.find(img => img.id === 'property-2-2');
  const section4Image2 = PlaceHolderImages.find(img => img.id === 'property-3-1');
  const section5Image1 = PlaceHolderImages.find(img => img.id === 'client-female-1');
  const section5Image2 = PlaceHolderImages.find(img => img.id === 'client-male-1');
  const section6Image = PlaceHolderImages.find(img => img.id === 'property-4-1');

  return {
    hero_media_url: heroImage?.imageUrl || '',
    hero_media_type: 'image',
    theme: 'dark',
    feature_video_url: '', // Pode ser preenchido se necessário
    feature_video_title: 'Veja a Plataforma em Ação',
    section2_image: section2Image?.imageUrl || '',
    section3_image: section3Image?.imageUrl || '',
    section4_image1: section4Image1?.imageUrl || '',
    section4_image2: section4Image2?.imageUrl || '',
    section5_image1: section5Image1?.imageUrl || '',
    section5_image2: section5Image2?.imageUrl || '',
    section6_image: section6Image?.imageUrl || '',
    supportEmail: 'contato@amaimobi.com.br',
  };
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
  const content = getMarketingPageContent();
  return <MarketingClientPage serverContent={content} />;
}
