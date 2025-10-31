
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
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
import { getFirebaseServer } from '@/firebase/server-init';
import { AgentPageContent } from '@/components/agent-page-content';

type Props = {
  params: { agentId: string };
};

export default async function AgentPublicPage({ params }: Props) {
    const { agentId } = params;
    const { firestore } = getFirebaseServer();
    
    let agent: Agent | null = null;
    let properties: Property[] = [];

    try {
        const agentRef = doc(firestore, 'agents', agentId);
        const agentSnap = await getDoc(agentRef);

        if (agentSnap.exists()) {
            agent = { id: agentSnap.id, ...agentSnap.data() } as Agent;
        } else {
            notFound();
        }

        const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
        const propertiesSnap = await getDocs(propertiesRef);
        properties = propertiesSnap.docs.map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: agentId }));

    } catch (error) {
        console.error("Error fetching agent data on server:", error);
        // Depending on the error, you might want to show a generic error page
        // For now, we'll let it fall through to the !agent check.
    }
    
    if (!agent) {
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-background text-center">
                <h1 className="text-4xl font-bold mb-4">Corretor não encontrado</h1>
                <p className="text-muted-foreground">O link que você acessou pode estar quebrado ou o corretor não existe mais.</p>
            </div>
        )
    }

    const reviews = getReviews();
    const reviewAvatars = reviews.map(r => {
        const avatar = PlaceHolderImages.find(img => img.id === r.avatar);
        return avatar || PlaceHolderImages[0];
    });

    const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
    const featuredProperties = properties.filter(p => p.featured);

    return (
        <>
            <Header agentName={agent.name} />
            <main className="min-h-screen">
                <Hero heroImage={heroImage}>
                     <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4'>
                        <AgentPageContent allProperties={properties} agent={agent} />
                    </div>
                </Hero>
                
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
