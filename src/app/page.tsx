import type { Metadata } from "next";
import { getSEO } from "@/firebase/seo";
import MarketingClientPage from "./marketing-client-page";

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

export default function MarketingPage() {
  return <MarketingClientPage />;
}
