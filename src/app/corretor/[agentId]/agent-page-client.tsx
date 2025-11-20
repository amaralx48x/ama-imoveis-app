
'use client';

import { useMemo, useEffect, useState } from 'react';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FeaturedProperties } from '@/components/featured-properties';
import { CustomPropertySection } from '@/components/custom-property-section';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { FloatingContactButton } from '@/components/floating-contact-button';
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes } from '@/lib/data';
import { useDemo, DemoState } from '@/context/DemoContext';


type AgentPageClientProps = {
    isDemo: boolean;
    serverData: DemoState | null;
}

export default function AgentPageClient({ isDemo, serverData }: AgentPageClientProps) {
  const { demoState } = useDemo();
  const [data, setData] = useState<DemoState | null>(serverData);

  useEffect(() => {
    if (isDemo) {
        setData(demoState);
    } else {
        setData(serverData);
    }
  }, [isDemo, demoState, serverData]);

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

  if (!agent) {
    if (isDemo && !demoState) return <div>Carregando demonstração...</div>;
    return notFound();
  }
  
  const customHeroImage = agent.siteSettings?.heroImageUrl;
  const defaultHeroImage = PlaceHolderImages.find(img => img.id === 'hero-background');
  const heroImage = customHeroImage ? { id: 'custom-hero', imageUrl: customHeroImage, description: 'Imagem de capa', imageHint: 'real estate' } : defaultHeroImage;

  const featuredProperties = allProperties.filter(p => (p.sectionIds || []).includes('featured') && p.status === 'ativo');
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
          const sectionProperties = allProperties.filter(p => (p.sectionIds || []).includes(section.id) && p.status === 'ativo');
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
            <ClientReviews reviews={reviews} agentId={agent.id} onReviewSubmitted={()=>{}} />
          </div>
        )}

        {whatsAppLink && <FloatingContactButton whatsAppLink={whatsAppLink} agent={agent} />}
      </main>
      <Footer agentId={agent.id} />
    </>
  );
}
