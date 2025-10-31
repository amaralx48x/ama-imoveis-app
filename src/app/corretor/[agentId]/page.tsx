
'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, Query } from 'firebase/firestore';
import type { Agent, Property } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FeaturedProperties } from '@/components/featured-properties';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { getReviews, getPropertyTypes } from '@/lib/data';
import { ContactForm } from '@/components/contact-form';
import { useFirestore } from '@/firebase';
import PropertyFilters from '@/components/property-filters';
import { filterProperties } from '@/lib/filter-logic';
import { PropertyCard } from '@/components/property-card';


type Props = {
  params: { agentId: string };
};

export default function AgentPublicPage({ params }: Props) {
    const { agentId } = params;
    const firestore = useFirestore();
    
    const [agent, setAgent] = useState<Agent | null>(null);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                setFilteredProperties(props);
            } catch (error) {
                console.error("Error fetching agent data on client:", error);
                // Optionally handle error state in UI
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [firestore, agentId]);

    const handleFilter = (filters: any) => {
        const result = filterProperties(allProperties, filters);
        setFilteredProperties(result);
    };

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

    const reviews = getReviews();
    const reviewAvatars = reviews.map(r => {
        const avatar = PlaceHolderImages.find(img => img.id === r.avatar);
        return avatar || PlaceHolderImages[0];
    });

    const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
    const featuredProperties = allProperties.filter(p => p.featured);
    const cities = agent.cities || [];
    const propertyTypes = getPropertyTypes();

    return (
        <>
            <Header agentName={agent.name} />
            <main className="min-h-screen">
                <Hero heroImage={heroImage}>
                    <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4'>
                       <PropertyFilters onFilter={handleFilter} cities={cities} propertyTypes={propertyTypes} />
                    </div>
                </Hero>
                
                 <section className="py-16 sm:py-24 bg-background" id="imoveis">
                    <div className="container mx-auto px-4">
                         <div className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                                Nossos <span className="text-gradient">Imóveis</span>
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                                Explore nosso portfólio completo de propriedades disponíveis.
                            </p>
                        </div>
                        {filteredProperties.length > 0 ? (
                             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredProperties.map((property) => (
                                    <PropertyCard key={property.id} property={property} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-lg border-2 border-dashed">
                                <h2 className="text-2xl font-bold mb-2">Nenhum imóvel encontrado</h2>
                                <p className="text-muted-foreground">Tente ajustar seus filtros ou limpar a busca.</p>
                            </div>
                        )}
                    </div>
                </section>
                
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
