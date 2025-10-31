
'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, Query, query, where, orderBy, limit } from 'firebase/firestore';
import type { Agent, Property, Review } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FeaturedProperties } from '@/components/featured-properties';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { ContactForm } from '@/components/contact-form';
import { useFirestore } from '@/firebase';
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes } from '@/lib/data';


type Props = {
  params: { agentId: string };
};

export default function AgentPublicPage({ params }: Props) {
    const { agentId } = params;
    const firestore = useFirestore();
    
    const [agent, setAgent] = useState<Agent | null>(null);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadReviews = async () => {
      if (!firestore) return;
      const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);
      const q = query(reviewsRef, where('approved', '==', true), orderBy('createdAt', 'desc'), limit(4));
      const reviewsSnap = await getDocs(q);
      setReviews(reviewsSnap.docs.map(doc => ({ ...(doc.data() as Omit<Review, 'id'>), id: doc.id })));
    };
    
    useEffect(() => {
        if (!firestore) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const agentRef = doc(firestore, 'agents', agentId);
                const agentSnap = await getDoc(agentRef);

                if (!agentSnap.exists()) {
                    notFound();
                    return;
                }
                
                const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
                setAgent(agentData);

                const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
                const propertiesSnap = await getDocs(propertiesRef);
                const props = propertiesSnap.docs.map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: agentId }));

                setAllProperties(props);
                
                await loadReviews();

            } catch (error) {
                console.error("Error fetching agent data on client:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firestore, agentId]);

    if (isLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        );
    }
    
    if (!agent) {
        return (
             <div className="flex flex-col items-center justify-center h-screen bg-background text-center">
                <h1 className="text-4xl font-bold mb-4">Corretor não encontrado</h1>
                <p className="text-muted-foreground">O link que você acessou pode estar quebrado ou o corretor não existe mais.</p>
            </div>
        )
    }

    const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
    const featuredProperties = allProperties.filter(p => p.featured);
    const propertyTypes = getPropertyTypes();
    const showReviews = agent.siteSettings?.showReviews ?? true;

    return (
        <>
            <Header agentName={agent.name} />
            <main className="min-h-screen">
                <Hero heroImage={heroImage}>
                    <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4'>
                       <PropertyFilters agent={agent} propertyTypes={propertyTypes} />
                    </div>
                </Hero>
                
                {featuredProperties.length > 0 && (
                    <FeaturedProperties properties={featuredProperties} agentId={agentId} />
                )}
                <AgentProfile agent={agent} />
                {showReviews && (
                  <div className="container mx-auto px-4 py-16 sm:py-24">
                    <ClientReviews reviews={reviews} agentId={agentId} onReviewSubmitted={loadReviews} />
                  </div>
                )}
                <ContactForm agentId={agent.id} />
            </main>
            <Footer />
        </>
    );
}
