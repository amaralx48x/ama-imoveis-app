
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, Query, query, where, orderBy, limit } from 'firebase/firestore';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FeaturedProperties } from '@/components/featured-properties';
import { CustomPropertySection } from '@/components/custom-property-section';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { ContactForm } from '@/components/contact-form';
import { useFirestore } from '@/firebase';
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes, getReviews as getStaticReviews } from '@/lib/data';


type Props = {
  params: { agentId: string };
};

export default function AgentPublicPage({ }: Props) {
    const params = useParams();
    const agentId = params.agentId as string;
    const firestore = useFirestore();
    
    const [agent, setAgent] = useState<Agent | null>(null);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [customSections, setCustomSections] = useState<CustomSection[]>([]);
    const [reviews, setReviews] = useState<Review[]>(getStaticReviews());
    const [isLoading, setIsLoading] = useState(true);

    const loadReviews = useCallback(async () => {
      if (!firestore || !agentId) return;
      const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);
      const q = query(reviewsRef, where('approved', '==', true), orderBy('createdAt', 'desc'), limit(10));
      
      try {
        const reviewsSnap = await getDocs(q);
        if (!reviewsSnap.empty) {
          setReviews(reviewsSnap.docs.map(doc => ({ ...(doc.data() as Omit<Review, 'id'>), id: doc.id })));
        } else {
           setReviews(getStaticReviews());
        }
      } catch (error) {
        console.error("Error loading reviews, falling back to static reviews:", error);
        setReviews(getStaticReviews());
      }
    }, [firestore, agentId]);
    
    useEffect(() => {
        if (!firestore || !agentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch agent, properties, and custom sections in parallel
                const agentRef = doc(firestore, 'agents', agentId);
                const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
                const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);

                const [agentSnap, propertiesSnap, sectionsSnap] = await Promise.all([
                    getDoc(agentRef),
                    getDocs(propertiesRef), // Simplified query
                    getDocs(query(sectionsRef, orderBy('order', 'asc')))
                ]);

                if (!agentSnap.exists()) {
                    notFound();
                    return;
                }
                
                const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
                setAgent(agentData);

                // Filter active properties on the client-side
                const props = propertiesSnap.docs
                    .map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: agentId }))
                    .filter(p => p.status !== 'vendido' && p.status !== 'alugado');
                setAllProperties(props);

                const sections = sectionsSnap.docs.map(doc => ({ ...(doc.data() as Omit<CustomSection, 'id'>), id: doc.id }));
                setCustomSections(sections);
                
                await loadReviews();

            } catch (error) {
                console.error("Error fetching agent data on client:", error);
                 // If the complex query fails due to missing index, try a simpler one
                if ((error as any)?.code === 'failed-precondition') {
                    try {
                        const agentRef = doc(firestore, 'agents', agentId);
                        const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
                        const agentSnap = await getDoc(agentRef);
                        const propertiesSnap = await getDocs(propertiesRef);
                         if (agentSnap.exists()) {
                            const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
                            setAgent(agentData);
                            const props = propertiesSnap.docs.map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: agentId })).filter(p => p.status !== 'vendido' && p.status !== 'alugado');
                            setAllProperties(props);
                        }
                    } catch (fallbackError) {
                         console.error("Fallback data fetch also failed:", fallbackError);
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firestore, agentId, loadReviews]);

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
    const featuredProperties = allProperties.filter(p => (p.sectionIds || []).includes('featured'));
    const propertyTypes = getPropertyTypes();
    const showReviews = agent.siteSettings?.showReviews ?? true;

    return (
        <>
            <Header agent={agent} agentId={agent.id}/>
            <main className="min-h-screen">
                <div className="relative mb-36">
                    <Hero heroImage={heroImage}>
                        <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4'>
                           <PropertyFilters agent={agent} propertyTypes={propertyTypes} />
                        </div>
                    </Hero>
                </div>
                
                {featuredProperties.length > 0 && (
                    <FeaturedProperties properties={featuredProperties} agentId={agentId} />
                )}

                {customSections.map(section => {
                    const sectionProperties = allProperties.filter(p => (p.sectionIds || []).includes(section.id));
                    if (sectionProperties.length === 0) return null;
                    return (
                        <CustomPropertySection 
                            key={section.id} 
                            title={section.title}
                            properties={sectionProperties} 
                            agentId={agentId} 
                            sectionId={section.id}
                        />
                    )
                })}

                <AgentProfile agent={agent} />
                {showReviews && (
                  <div className="container mx-auto px-4 py-16 sm:py-24">
                    <ClientReviews reviews={reviews} agentId={agentId} onReviewSubmitted={loadReviews} />
                  </div>
                )}
                <ContactForm agentId={agent.id} />
            </main>
            <Footer agentId={agent.id} />
        </>
    );
}
