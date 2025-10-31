
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Agent, Property } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FeaturedProperties } from '@/components/featured-properties';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { getReviews } from '@/lib/data';
import { ContactForm } from '@/components/contact-form';

type Props = {
  params: { agentId: string };
};

async function getAgentData(agentId: string) {
    const { firestore } = getFirebaseServer();
    const agentRef = doc(firestore, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
        return null;
    }
    return { id: agentSnap.id, ...agentSnap.data() } as Agent;
}

async function getAgentProperties(agentId: string) {
    const { firestore } = getFirebaseServer();
    const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
    const q = query(propertiesRef, where("featured", "==", true));
    const propertiesSnap = await getDocs(q);
    
    return propertiesSnap.docs.map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: agentId }));
}


export default async function AgentPublicPage({ params }: Props) {
  const { agentId } = params;
  
  if (!agentId) {
    notFound();
  }

  const agent = await getAgentData(agentId);
  if (!agent) {
    notFound();
  }

  const featuredProperties = await getAgentProperties(agentId);
  const reviews = getReviews();
  
  const reviewAvatars = reviews.map(r => {
    const avatar = PlaceHolderImages.find(img => img.id === r.avatar);
    return avatar || PlaceHolderImages[0];
  });

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');

  return (
    <>
      <Header agentName={agent.name} />
      <main className="min-h-screen">
        <Hero heroImage={heroImage} />
        {featuredProperties.length > 0 && (
            <FeaturedProperties properties={featuredProperties} />
        )}
        <AgentProfile agent={agent} />
        <ClientReviews reviews={reviews} avatars={reviewAvatars} />
        <ContactForm agentId={agent.id} />
      </main>
      <Footer />
    </>
  );
}
