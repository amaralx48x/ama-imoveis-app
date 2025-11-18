import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound } from "next/navigation";
import { getReviews as getStaticReviews } from '@/lib/data';
import { getSEO } from "@/firebase/server-actions/seo";


async function getAgentData(agentId: string) {
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
    
    const allProperties = propertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }) as Property);
    
    const customSections = sectionsSnap.docs.map(d => ({ ...(d.data() as Omit<CustomSection, 'id'>), id: d.id }) as CustomSection);

    let reviews: Review[];
    if (!reviewsSnap.empty) {
      const fetchedReviews = reviewsSnap.docs.map(doc => ({ ...(doc.data() as Omit<Review, 'id'>), id: doc.id }));
      fetchedReviews.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
      });
      reviews = fetchedReviews;
    } else {
      reviews = getStaticReviews();
    }

    return { agent, allProperties, customSections, reviews };

  } catch (error) {
    console.error("Failed to fetch agent data on server:", error);
    return null;
  }
}


export async function generateMetadata({ params }: { params: { agentId: string } }): Promise<Metadata> {
  const { agentId } = params;

  // Use the server-safe SEO function
  const agentSeoData = await getSEO(`agent-${agentId}`);
  const defaultSeo = await getSEO("homepage");
  
  const { firestore } = getFirebaseServer();
  const agentSnap = await getDoc(doc(firestore, 'agents', agentId));
  const agent = agentSnap.exists() ? agentSnap.data() as Agent : null;

  const title = agentSeoData?.title || agent?.name || defaultSeo?.title || 'Encontre seu Imóvel';
  const description = agentSeoData?.description || agent?.description || defaultSeo?.description || 'Seu próximo lar está aqui.';
  const keywords = agentSeoData?.keywords || defaultSeo?.keywords || [];
  const imageUrl = agentSeoData?.image || agent?.photoUrl || defaultSeo?.image || '';

  const metadata: Metadata = {
    title,
    description,
    keywords,
    openGraph: {
      type: 'website',
      url: `/corretor/${agentId}`,
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };

  return metadata;
}


export default async function AgentPublicPage({ params }: { params: { agentId: string } }) {
  const data = await getAgentData(params.agentId);

  if (!data) {
    return notFound();
  }

  return <AgentPageClient {...data} />;
}
