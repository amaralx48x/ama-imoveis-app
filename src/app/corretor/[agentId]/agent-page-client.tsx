
'use client';

import { useMemo, useState } from 'react';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { AgentProfile } from "@/components/agent-profile";
import { ClientReviews } from "@/components/client-reviews";
import { FloatingContactButton } from "@/components/floating-contact-button";
import { FeaturedProperties } from "@/components/featured-properties";
import { CustomPropertySection } from "@/components/custom-property-section";
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes } from '@/lib/data';
import { filterProperties, type Filters } from '@/lib/filter-logic';
import { PropertyCard } from '@/components/property-card';


export default function AgentPageClient({
  agent,
  allProperties,
  customSections,
  reviews,
}: {
  agent: Agent | null;
  allProperties: Property[];
  customSections: CustomSection[];
  reviews: Review[];
}) {
  const [filteredProperties, setFilteredProperties] = useState<Property[] | null>(null);

  if (!agent) {
    return notFound();
  }

  const heroImageUrl = agent.siteSettings?.heroImageUrl;
  const showReviews = agent.siteSettings?.showReviews ?? true;
  const whatsAppLink = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp');

  const featuredProperties = useMemo(() => {
    return allProperties.filter(p => (p.sectionIds || []).includes('featured'));
  }, [allProperties]);

  const handleFilter = (filters: Filters) => {
    const result = filterProperties(allProperties, filters);
    setFilteredProperties(result);
    // Smooth scroll to results
    document.getElementById('imoveis')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const propertyTypes = getPropertyTypes();
  const cities = agent.cities || [];

  return (
    <>
      <Header agent={agent} agentId={agent.id} />
      <main className="min-h-screen">
        <div className="relative mb-24 md:mb-36">
           <Hero heroImageUrl={heroImageUrl}>
            <PropertyFilters onFilter={handleFilter} agent={{...agent, cities}} propertyTypes={propertyTypes} />
          </Hero>
        </div>

        {/* This section will now serve as the container for dynamic results */}
        <section className="py-16 sm:py-24 bg-background" id="imoveis">
            <div className="container mx-auto px-4">
                {filteredProperties !== null ? (
                    // Displaying search results
                     <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                            Resultados da <span className="text-gradient">Busca</span> ({filteredProperties.length})
                        </h2>
                    </div>
                ) : (
                    // Default view before any search
                     <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-extrabold font-headline">
                            Nossos <span className="text-gradient">Imóveis</span>
                        </h2>
                    </div>
                )}
                
                {filteredProperties !== null ? (
                    filteredProperties.length > 0 ? (
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
                    )
                ) : (
                    // Initially, show featured properties if no search has been performed
                    <FeaturedProperties properties={featuredProperties} agentId={agent.id} />
                )}
            </div>
        </section>

        {/* Render custom sections only if no search is active */}
        {filteredProperties === null && customSections.map(section => {
          const sectionProperties = allProperties.filter(p => (p.sectionIds || []).includes(section.id));
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
