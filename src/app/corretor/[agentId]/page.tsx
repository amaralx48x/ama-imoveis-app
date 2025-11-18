import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { getSEO } from "@/firebase/seo";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc } from "firebase/firestore";
import type { Agent } from "@/lib/data";

async function getAgent(agentId: string): Promise<Agent | null> {
  const { firestore } = getFirebaseServer();
  const agentRef = doc(firestore, 'agents', agentId);
  const agentSnap = await getDoc(agentRef);
  if (!agentSnap.exists()) {
    return null;
  }
  return { id: agentSnap.id, ...agentSnap.data() } as Agent;
}


export async function generateMetadata({ params }: { params: { agentId: string } }): Promise<Metadata> {
  // Use a combinação de SEO do agente e SEO global como fallback
  const agentSeoKey = `agent-${params.agentId}`;
  const agentSeoData = await getSEO(agentSeoKey);
  const defaultSeo = await getSEO('homepage');
  const agent = await getAgent(params.agentId);

  const title = agentSeoData?.title || agent?.name || defaultSeo?.title || 'Encontre seu Imóvel';
  const description = agentSeoData?.description || agent?.description || defaultSeo?.description || 'Seu próximo lar está aqui.';
  const keywords = agentSeoData?.keywords || defaultSeo?.keywords || [];
  const imageUrl = agentSeoData?.image || agent?.photoUrl || defaultSeo?.image || '';

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


export default function AgentPublicPage({ params }: { params: { agentId: string } }) {
  return <AgentPageClient agentId={params.agentId} />;
}
