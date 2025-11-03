
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, Query, query, where, orderBy, limit } from 'firebase/firestore';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { FeaturedProperties } from "@/components/featured-properties";
import { CustomPropertySection } from '@/components/custom-property-section';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { FloatingContactButton } from '@/components/floating-contact-button';
import { useFirestore, useUser } from '@/firebase';
import { getPropertyTypes, getReviews as getStaticReviews } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';


type Props = {
  params: { agentId: string };
};

export default function AgentPublicPage({ }: Props) {
    const params = useParams();
    const agentId = params.agentId as string;
    const firestore = useFirestore();
    const { user: loggedInUser } = useUser();
    
    const [agent, setAgent] = useState<Agent | null>(null);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [customSections, setCustomSections] = useState<CustomSection[]>([]);
    const [reviews, setReviews] = useState<Review[]>(getStaticReviews());
    const [isLoading, setIsLoading] = useState(true);

    const loadReviews = useCallback(async () => {
      if (!firestore || !agentId) return;
      const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);
      const q = query(reviewsRef, where('approved', '==', true), limit(10));
      
      try {
        const reviewsSnap = await getDocs(q);
        if (!reviewsSnap.empty) {
          const fetchedReviews = reviewsSnap.docs.map(doc => ({ ...(doc.data() as Omit<Review, 'id'>), id: doc.id }));
          fetchedReviews.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
          setReviews(fetchedReviews);
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
            console.debug(`[DEBUG] Iniciando busca de dados para o corretor: ${agentId}`);
            try {
                const agentRef = doc(firestore, 'agents', agentId);
                const propertiesQuery = collection(firestore, `agents/${agentId}/properties`);
                const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);

                const [agentSnap, propertiesSnap, sectionsSnap] = await Promise.all([
                    getDoc(agentRef),
                    getDocs(propertiesQuery),
                    getDocs(query(sectionsRef, orderBy('order', 'asc')))
                ]);

                if (!agentSnap.exists()) {
                    console.error("[DEBUG] Corretor não encontrado.");
                    setAgent(null);
                    return;
                }
                
                const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
                setAgent(agentData);
                console.debug("[DEBUG] Dados do corretor carregados:", agentData);


                const allProps = propertiesSnap.docs.map(doc => ({ ...(doc.data() as Omit<Property, 'id'>), id: doc.id, agentId: agentId }));
                console.debug('[DEBUG] Total de imóveis carregados (bruto):', allProps.length, allProps);
                
                // Filtrando imóveis "ativos" no lado do cliente para maior robustez
                const activeProperties = allProps.filter(p => ['ativo', 'Ativo', 'active'].includes(p.status ?? ''));
                setAllProperties(activeProperties);
                console.debug(`[DEBUG] Total de ${activeProperties.length} imóveis ativos filtrados:`, activeProperties);


                const sections = sectionsSnap.docs.map(doc => ({ ...(doc.data() as Omit<CustomSection, 'id'>), id: doc.id }));
                setCustomSections(sections);
                console.debug(`[DEBUG] Total de ${sections.length} seções personalizadas carregadas:`, sections);
                
                await loadReviews();

            } catch (error) {
                console.error("[DEBUG] Erro ao buscar dados do corretor:", error);
            } finally {
                setIsLoading(false);
                console.debug("[DEBUG] Busca de dados finalizada.");
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

    const isOwner = loggedInUser && loggedInUser.uid === agent.id;
    const isSiteActive = agent.siteSettings?.siteStatus ?? true;

    if (!isSiteActive && !isOwner) {
        return (
            <>
                <Header agent={agent} agentId={agent.id}/>
                <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] flex items-center justify-center">
                     <Card className="max-w-md text-center">
                         <CardHeader>
                            <CardTitle className="flex items-center justify-center gap-2 text-2xl"><Construction/> Site em Manutenção</CardTitle>
                         </CardHeader>
                         <CardContent>
                             <p className="text-muted-foreground">O corretor está fazendo melhorias no site. Por favor, volte mais tarde!</p>
                         </CardContent>
                     </Card>
                </main>
                <Footer agentId={agent.id} />
            </>
        )
    }

    const featuredProperties = allProperties.filter(p => (p.sectionIds || []).includes('featured'));
    console.debug(`[DEBUG] Imóveis filtrados para a seção 'Destaques': ${featuredProperties.length}`, featuredProperties);

    const propertyTypes = getPropertyTypes();
    const showReviews = agent.siteSettings?.showReviews ?? true;
    const whatsAppLink = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp');

    return (
        <>
            <Header agent={agent} agentId={agent.id}/>
            <main className="min-h-screen">
                 <Hero agent={agent} propertyTypes={propertyTypes}/>
                
                {featuredProperties.length > 0 && (
                    <FeaturedProperties properties={featuredProperties} agentId={agentId} />
                )}

                {customSections.map(section => {
                    const sectionProperties = allProperties.filter(p => (p.sectionIds || []).includes(section.id));
                    console.debug(`[DEBUG] Para a seção '${section.title}' (ID: ${section.id}), foram encontrados ${sectionProperties.length} imóveis.`, sectionProperties);

                    if (sectionProperties.length === 0) {
                        console.debug(`[DEBUG] A seção '${section.title}' não será renderizada por não ter imóveis associados.`);
                        return null;
                    }
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
                {whatsAppLink && <FloatingContactButton whatsAppLink={whatsAppLink} agent={agent}/>}
            </main>
            <Footer agentId={agent.id} />
        </>
    );
}
