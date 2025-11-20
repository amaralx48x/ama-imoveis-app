
'use client';

import { useMemo, useEffect, useState, Suspense } from 'react';
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
import { useDemo, type DemoState } from '@/context/DemoContext';


type AgentPageClientProps = {
    serverData: DemoState | null;
}

function AgentPageContent({ serverData }: AgentPageClientProps) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const { demoState, updateDemoData } = useDemo();

  const data = isDemo ? demoState : serverData;

  const agent = data?.agent;
  const allProperties = data?.properties || [];
  const customSections = data?.customSections || [];
  const reviews = data?.reviews || [];

  const citiesForFilter = useMemo(() => {
    if (!agent) return [];
    const agentCities = agent.cities || [];
    const propertyCities = allProperties.map(p => p.city).filter(Boolean);
    return [...new Set([...agentCities, ...propertyCities])].sort();
  }, [agent, allProperties]);
  
  const onReviewSubmitted = () => {
    // In a real scenario, this would trigger a refetch of reviews.
    // In demo mode, we could potentially update the demoState.
  };

  if (!agent) {
    if (isDemo && !demoState) return <div>Carregando demonstração...</div>;
    return notFound();
  }
  
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
      <Header agent={agent} agentId={agent.id} />
      <main className="min-h-screen">
        <div className="relative mb-24 md:mb-36">
          <Hero heroImage={heroImage}>
            <PropertyFilters agent={{...agent, cities: citiesForFilter}} propertyTypes={propertyTypes} />
          </Hero>
        </div>

        {featuredProperties.length > 0 && (
          <FeaturedProperties properties={featuredProperties} agentId={agent.id} />
        )}

        {customSections.map(section => {
          const sectionProperties = activeProperties.filter(p => (p.sectionIds || []).includes(section.id));
          if (sectionProperties.length === 0) return null;
          return (
            <CustomPropertySection
              key={section.id}
              title={section.title}
              properties={sectionProperties}
              agentId={agent.id}
              sectionId={section.id}
            />
          );
        })}

        <AgentProfile agent={agent} />

        {showReviews && (
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <ClientReviews reviews={reviews} agentId={agent.id} onReviewSubmitted={onReviewSubmitted} />
          </div>
        )}

        {whatsAppLink && <FloatingContactButton whatsAppLink={whatsAppLink} agent={agent} />}
      </main>
      <Footer agentId={agent.id} />
    </>
  );
}


export default function AgentPageClient(props: AgentPageClientProps) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AgentPageContent {...props} />
    </Suspense>
  )
}
