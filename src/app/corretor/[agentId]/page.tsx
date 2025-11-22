import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound } from "next/navigation";
import { getReviews as getStaticReviews, getProperties as getStaticProperties } from '@/lib/data';
import { getSEO } from "@/firebase/server-actions/seo";


async function getAgentData(agentId: string) {
  const { firestore } = getFirebaseServer();
  
  // Early exit for example page to avoid unnecessary Firestore calls
  if (agentId === 'exemplo') {
    const exampleAgent: Agent = {
      id: 'exemplo',
      displayName: 'Corretor Exemplo',
      name: 'Imóveis Exemplo',
      accountType: 'corretor',
      description: 'Este é um perfil de demonstração para mostrar como seu site público pode parecer. Todas as informações e imóveis aqui são fictícios.',
      email: 'contato@exemplo.com',
      creci: '000000-F',
      photoUrl: 'https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjE5NTYzOTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      siteSettings: {
          showReviews: true,
          socialLinks: [
              { id: '1', label: 'WhatsApp', url: '5511999999999', icon: 'whatsapp' },
              { id: '2', label: 'Instagram', url: 'seu_usuario', icon: 'instagram' },
          ]
      }
    };
    const allProperties = getStaticProperties().map(p => ({...p, agentId: 'exemplo'}));
    const reviews = getStaticReviews();
    
    return { 
        agent: JSON.parse(JSON.stringify(exampleAgent)),
        allProperties: JSON.parse(JSON.stringify(allProperties)), 
        customSections: [],
        reviews: JSON.parse(JSON.stringify(reviews)),
    };
  }

  const agentRef = doc(firestore, 'agents', agentId);
  const agentSnap = await getDoc(agentRef);

  if (!agentSnap.exists() || (agentSnap.data() as Agent).siteSettings?.siteStatus === false) {
    return null;
  }

  const agent = { id: agentSnap.id, ...agentSnap.data() } as Agent;

  const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
  const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);
  const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);

  try {
    const [propertiesSnap, sectionsSnap, reviewsSnap] = await Promise.all([
      getDocs(query(propertiesRef, where('status', '==', 'ativo'))),
      getDocs(query(sectionsRef, orderBy('order', 'asc'))),
      getDocs(query(reviewsRef, where('approved', '==', true), limit(10))),
    ]);

    let allProperties: Property[];
    if (!propertiesSnap.empty) {
        allProperties = propertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }) as Property);
    } else {
        // Se o corretor não tiver imóveis, use os exemplos
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
      // Se o corretor não tiver avaliações, use os exemplos
      reviews = getStaticReviews();
    }

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

async function getAgentSeoData(agentId: string) {
    const agentSeo = await getSEO(`agent-${agentId}`);
    
    // Get agent data only if SEO data is not sufficient
    let agent = null;
    if (!agentSeo?.title || !agentSeo?.description) {
      const { firestore } = getFirebaseServer();
      const agentSnap = await getDoc(doc(firestore, 'agents', agentId));
      agent = agentSnap.exists() ? agentSnap.data() as Agent : null;
    }
  
    const defaultSeo = await getSEO("homepage");
    
    return { agentSeo, defaultSeo, agent };
}


export async function generateMetadata({ params }: { params: Promise<{ agentId: string }> }): Promise<Metadata> {
  const { agentId } = await params;

  const { agentSeo, defaultSeo, agent } = await getAgentSeoData(agentId);

  const title = agentSeo?.title || agent?.name || defaultSeo?.title || 'Encontre seu Imóvel';
  const description = agentSeo?.description || agent?.description || defaultSeo?.description || 'Seu próximo lar está aqui.';
  const keywords = agentSeo?.keywords || defaultSeo?.keywords || [];
  const imageUrl = agentSeo?.image || agent?.photoUrl || defaultSeo?.image || '';

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


export default async function AgentPublicPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  const data = await getAgentData(agentId);

  if (!data) {
    return notFound();
  }

  return <AgentPageClient {...data} />;
}
