import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound } from "next/navigation";
import { getReviews as getStaticReviews, getProperties as getStaticProperties, getAgent as getStaticAgent } from '@/lib/data';
import { getSEO } from "@/firebase/server-actions/seo";
import demoSnapshot from '@/lib/demo-data.json';


export async function generateMetadata({ params }: { params: { agentId: string } }): Promise<Metadata> {
  const seoData = await getSEO(`agent-${params.agentId}`);
  
  const title = seoData?.title || "Página do Corretor";
  const description = seoData?.description || "Confira os imóveis deste corretor.";
  const keywords = seoData?.keywords || ["imóveis", "corretor"];
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


async function getAgentData(agentId: string) {
  // DEMO MODE: Serve data from local snapshot
  if (agentId === 'demo-user-arthur') {
    return {
        agent: JSON.parse(JSON.stringify(demoSnapshot.agent)),
        allProperties: JSON.parse(JSON.stringify(demoSnapshot.properties)),
        customSections: JSON.parse(JSON.stringify(demoSnapshot.customSections)),
        reviews: JSON.parse(JSON.stringify(demoSnapshot.reviews)),
    };
  }

  // REAL MODE: Fetch from Firestore
  const { firestore } = getFirebaseServer();
  
  const agentRef = doc(firestore, 'agents', agentId);
  const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
  const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);
  const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);

  try {
    const [agentSnap, propertiesSnap, sectionsSnap, reviewsSnap] = await Promise.all([
      getDoc(agentRef),
      getDocs(query(propertiesRef, where('status', '==', 'ativo'))),
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
        // Fallback static data if firestore is empty
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

    // Use JSON stringify/parse to ensure data is serializable for client components
    return { 
        agent: JSON.parse(JSON.stringify(agent)),
        allProperties: JSON.parse(JSON.stringify(allProperties)), 
        customSections: JSON.parse(JSON.stringify(customSections)),
        reviews: JSON.parse(JSON.stringify(reviews)),
    };

  } catch (error) {
    console.error("Failed to fetch agent data on server:", error);
    return null;
  }
}

export default async function AgentPublicPage({ params }: { params: { agentId: string } }) {
  const { agentId } = params;
  const data = await getAgentData(agentId);
  
  if (!data) {
    return notFound();
  }

  return <AgentPageClient {...data} />;
}
