import type { Metadata } from "next";
import MarketingClientPage from "./marketing-client-page";
import { getSEO } from "@/firebase/server-actions/seo";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc } from "firebase/firestore";
import type { MarketingContent } from "@/lib/data";


export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSEO("homepage");
  
  const title = seoData?.title || "AMA Imóveis - A plataforma para corretores";
  const description = seoData?.description || "Gerencie anúncios, leads, visitas e comissões — tudo num só lugar.";
  const keywords = seoData?.keywords || ["imobiliária", "corretor de imóveis", "crm imobiliário", "site para corretor"];
  const imageUrl = seoData?.image || "";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

async function getMarketingContent() {
  const { firestore } = getFirebaseServer();
  const marketingRef = doc(firestore, 'marketing', 'content');
  const marketingSnap = await getDoc(marketingRef);

  if (marketingSnap.exists()) {
    return JSON.parse(JSON.stringify(marketingSnap.data())) as MarketingContent;
  }
  return null;
}

export default async function MarketingPage() {
  const content = await getMarketingContent();
  return <MarketingClientPage content={content} />;
}
