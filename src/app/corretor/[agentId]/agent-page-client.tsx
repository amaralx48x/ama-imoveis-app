'use client';

import { useMemo, Suspense } from 'react';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound, useSearchParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { FeaturedProperties } from '@/components/featured-properties';
import { CustomPropertySection } from '@/components/custom-property-section';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { FloatingContactButton } from '@/components/floating-contact-button';
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes } from '@/lib/data';
import { useDemo } from '@/context/DemoContext';
import { Loader2 } from 'lucide-react';

type AgentPageClientProps = {
    serverData?: {
        agent: Agent;
        properties: Property[];
        customSections: CustomSection[];
        reviews: Review[];
    } | null;
    isDemo: boolean;
    demoSessionId?: string;
}

function AgentPageContent({ serverData, isDemo, demoSessionId }: AgentPageClientProps) {
  const { demoState, isLoadingDemo } = useDemo();

  const data = isDemo ? demoState : serverData;

  if (isDemo && isLoadingDemo) {
      return (
          <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg">Carregando sua demonstração...</p>
          </div>
      )
  }

  if (!data || !data.agent) {
    return notFound();
  }

  const { agent, properties: allProperties, customSections, reviews } = data;
  const agentId = isDemo ? demoSessionId : agent.id;

  const citiesForFilter = useMemo(() => {
    const agentCities = agent.cities || [];
    const propertyCities = allProperties.map(p => p.city).filter(Boolean);
    return [...new Set([...agentCities, ...propertyCities])].sort();
  }, [agent, allProperties]);
  
  const onReviewSubmitted = () => {
    // In a real app, this would invalidate a cache to refetch reviews.
  };

  const customHeroImage = agent.siteSettings?.heroImageUrl;
  const defaultHeroImage = { id: 'default-hero', imageUrl: 'https://picsum.photos/seed/hero-bg/1920/1080', description: 'Imagem de capa', imageHint: 'real estate' };
  const heroImage = customHeroImage ? { id: 'custom-hero', imageUrl: customHeroImage, description: 'Imagem de capa', imageHint: 'real estate' } : defaultHeroImage;

  const activeProperties = allProperties.filter(p => p.status === 'ativo' || !p.status);
  const featuredProperties = activeProperties.filter(p => (p.sectionIds || []).includes('featured'));
  const propertyTypes = getPropertyTypes();
  const showReviews = agent.siteSettings?.showReviews ?? true;
  const whatsAppLink = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp');

  return (
    <>
      <Header agent={agent} agentId={agentId} />
      <main className="min-h-screen">
        <div className="relative mb-24 md:mb-36">
          <Hero heroImage={heroImage}>
            <PropertyFilters agent={{...agent, cities: citiesForFilter}} propertyTypes={propertyTypes} />
          </Hero>
        </div>

        {featuredProperties.length > 0 && (
          <FeaturedProperties properties={featuredProperties} agentId={agentId || ''} />
        )}

        {customSections.map(section => {
          const sectionProperties = activeProperties.filter(p => (p.sectionIds || []).includes(section.id));
          if (sectionProperties.length === 0) return null;
          return (
            <CustomPropertySection
              key={section.id}
              title={section.title}
              properties={sectionProperties}
              agentId={agentId || ''}
              sectionId={section.id}
            />
          );
        })}

        <AgentProfile agent={agent} />

        {showReviews && (
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <ClientReviews reviews={reviews} agentId={agentId || ''} onReviewSubmitted={onReviewSubmitted} />
          </div>
        )}

        {whatsAppLink && <FloatingContactButton whatsAppLink={whatsAppLink} agent={agent} />}
      </main>
      <Footer agentId={agentId} />
    </>
  );
}


export default function AgentPageClient(props: AgentPageClientProps) {
  return (
    <Suspense fallback={
         <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg">Carregando página...</p>
          </div>
    }>
      <AgentPageContent {...props} />
    </Suspense>
  )
}
