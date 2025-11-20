import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound } from "next/navigation";
import { getReviews as getStaticReviews, getProperties as getStaticProperties } from '@/lib/data';
import { getSEO } from "@/firebase/server-actions/seo";


// -------------------------------------------------------------
// FIX 1 → params e searchParams precisam ser awaited em generateMetadata
// -------------------------------------------------------------
export async function generateMetadata(props: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {

  const params = await props.params;
  const searchParams = await props.searchParams;

  const isDemo = searchParams?.demo === "true";
  const seoKey = isDemo ? `agent-DEMO_AGENT_ID_999` : `agent-${params.agentId}`;

  if (isDemo) {
    return {
      title: "Página do Corretor (Demonstração)",
      description: "Confira os imóveis deste corretor em modo de demonstração.",
    };
  }

  const seoData = await getSEO(seoKey);

  return {
    title: seoData?.title || "Página do Corretor",
    description: seoData?.description || "Confira os imóveis deste corretor.",
    keywords: seoData?.keywords || ["imóveis", "corretor"],
    openGraph: {
      title: seoData?.title || "Página do Corretor",
      description: seoData?.description || "Confira os imóveis deste corretor.",
      images: seoData?.image ? [seoData.image] : [],
    },
  };
}


// -------------------------------------------------------------
// Lógica existente (sem alterações)
// -------------------------------------------------------------
async function getAgentData(agentId: string) {
  const { firestore } = getFirebaseServer();
  
  const agentRef = doc(firestore, 'agents', agentId);
  const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
  const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);
  const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);

  try {
    const [agentSnap, propertiesSnap, sectionsSnap, reviewsSnap] = await Promise.all([
      getDoc(agentRef),
      getDocs(query(propertiesRef, where('status', 'in', ['ativo', null]))),
      getDocs(query(sectionsRef, orderBy('order', 'asc'))),
      getDocs(query(reviewsRef, where('approved', '==', true), limit(10))),
    ]);

    if (!agentSnap.exists() || (agentSnap.data() as Agent).siteSettings?.siteStatus === false) {
      return null;
    }

    const agent = { id: agentSnap.id, ...agentSnap.data() } as Agent;
    
    let allProperties: Property[];
    if (!propertiesSnap.empty) {
        allProperties = propertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }) as Property);
    } else {
        allProperties = getStaticProperties().map(p => ({...p, agentId}));
    }
    
    const customSections = sectionsSnap.docs.map(d => ({ ...(d.data() as Omit<CustomSection, 'id'>), id: d.id }) as CustomSection);

    let reviews: Review[];
    if (!reviewsSnap.empty) {
      const fetchedReviews = reviewsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as Omit<Review, 'id' | 'createdAt'>),
          id: doc.id,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        };
      });
      fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      reviews = fetchedReviews;
    } else {
      reviews = getStaticReviews();
    }

    return { 
        agent: JSON.parse(JSON.stringify(agent)),
        properties: JSON.parse(JSON.stringify(allProperties)), 
        customSections: JSON.parse(JSON.stringify(customSections)),
        reviews: JSON.parse(JSON.stringify(reviews)),
    };

  } catch (error) {
    console.error("Failed to fetch agent data on server:", error);
    return null;
  }
}


// -------------------------------------------------------------
// FIX 2 → mesma correção para params e searchParams na página server
// -------------------------------------------------------------
export default async function AgentPublicPage(props: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  const params = await props.params;
  const searchParams = await props.searchParams;

  if (!params || !searchParams) return notFound();

  const { agentId } = params;
  const isDemo = searchParams.demo === "true";

  if (isDemo) {
    return <AgentPageClient serverData={null} />;
  }
  
  const data = await getAgentData(agentId);
  
  if (!data) return notFound();

  return <AgentPageClient serverData={data} />;
}
