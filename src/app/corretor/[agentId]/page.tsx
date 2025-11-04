
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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
import { FloatingContactButton } from '@/components/floating-contact-button';
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

  // ✅ Carregar avaliações (reviews)
  const loadReviews = useCallback(async () => {
    if (!firestore || !agentId) return;
    try {
      const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);
      const q = query(reviewsRef, where('approved', '==', true), limit(10));
      const reviewsSnap = await getDocs(q);
      if (!reviewsSnap.empty) {
        const fetchedReviews = reviewsSnap.docs.map(doc => ({
          ...(doc.data() as Omit<Review, 'id'>),
          id: doc.id
        }));
        fetchedReviews.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return dateB - dateA;
        });
        setReviews(fetchedReviews);
      } else {
        console.warn("Nenhuma review aprovada encontrada — usando reviews estáticas.");
        setReviews(getStaticReviews());
      }
    } catch (error) {
      console.error("Erro ao carregar reviews, usando fallback:", error);
      setReviews(getStaticReviews());
    }
  }, [firestore, agentId]);

  // ✅ Carregar corretor, imóveis e seções
  useEffect(() => {
    if (!firestore || !agentId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const agentRef = doc(firestore, 'agents', agentId);
        const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
        const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);

        // Queries principais com fallback interno
        const [agentSnap, propertiesSnap, sectionsSnap] = await Promise.all([
          getDoc(agentRef),
          getDocs(query(propertiesRef, where('status', '==', 'ativo'))).catch(err => {
            console.warn("Query de imóveis falhou, fallback sem filtro:", err);
            return getDocs(propertiesRef);
          }),
          getDocs(query(sectionsRef, orderBy('order', 'asc'))).catch(err => {
            console.warn("Query de seções falhou, fallback sem orderBy:", err);
            return getDocs(sectionsRef);
          })
        ]);

        if (!agentSnap.exists()) {
          notFound();
          return;
        }

        const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
        setAgent(agentData);

        const props = propertiesSnap.docs.map(doc => ({
          ...(doc.data() as Omit<Property, 'id'>),
          id: doc.id,
          agentId: agentId,
        }));
        setAllProperties(props);

        const sections = sectionsSnap.docs.map(doc => ({
          ...(doc.data() as Omit<CustomSection, 'id'>),
          id: doc.id,
        }));
        setCustomSections(sections);

        await loadReviews();
      } catch (error) {
        console.error("Erro geral ao buscar dados do corretor:", error);
        // Tentativa de fallback total
        try {
          const agentRef = doc(firestore, 'agents', agentId);
          const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
          const agentSnap = await getDoc(agentRef);
          const propertiesSnap = await getDocs(propertiesRef);

          if (agentSnap.exists()) {
            const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
            setAgent(agentData);
            const props = propertiesSnap.docs.map(doc => ({
              ...(doc.data() as Omit<Property, 'id'>),
              id: doc.id,
              agentId: agentId,
            }));
            setAllProperties(props);
          }
        } catch (fallbackError) {
          console.error("Fallback total também falhou:", fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firestore, agentId, loadReviews]);

  // ✅ Estados de carregamento e erro
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
    );
  }

  // ✅ Dados prontos
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
  const featuredProperties = allProperties.filter(p => (p.sectionIds || []).includes('featured'));
  const propertyTypes = getPropertyTypes();
  const showReviews = agent.siteSettings?.showReviews ?? true;
  const whatsAppLink = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp');

  return (
    <>
      <Header agent={agent} agentId={agent.id} />
      <main className="min-h-screen">
        <div className="relative mb-24 md:mb-36">
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
          );
        })}

        <AgentProfile agent={agent} />
        {showReviews && (
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <ClientReviews reviews={reviews} agentId={agentId} onReviewSubmitted={loadReviews} />
          </div>
        )}
        {whatsAppLink && <FloatingContactButton whatsAppLink={whatsAppLink} agent={agent} />}
      </main>
      <Footer agentId={agent.id} />
    </>
  );
}
