
'use client';

import { useMemo, useState } from 'react';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Hero } from "@/components/hero";
import { FeaturedProperties } from '@/components/featured-properties';
import { CustomPropertySection } from '@/components/custom-property-section';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { FloatingContactButton } from '@/components/floating-contact-button';
import PropertyFilters from '@/components/property-filters';
import { getPropertyTypes } from '@/lib/data';
import { Filters, filterProperties } from '@/lib/filter-logic';
import { SearchResultsContent } from '@/app/search-results/page';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';


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

  const [searchResults, setSearchResults] = useState<Property[] | null>(null);

  const citiesForFilter = useMemo(() => {
    if (!agent) return [];
    const agentCities = agent.cities || [];
    const propertyCities = allProperties.map(p => p.city).filter(Boolean);
    return [...new Set([...agentCities, ...propertyCities])].sort();
  }, [agent, allProperties]);

  const handleSearch = (filters: Filters) => {
      const results = filterProperties(allProperties, filters);
      setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchResults(null);
  }

  // Se o agente não for encontrado ou o site estiver inativo (exceto para o dono logado), mostra 404
  if (!agent || (agent.siteSettings?.siteStatus === false)) {
    // Adicionar uma lógica futura para permitir que o dono do site veja a página mesmo offline
    return notFound();
  }

  const heroImageUrl = agent.siteSettings?.heroImageUrl;
  const featuredProperties = allProperties.filter(p => (p.sectionIds || []).includes('featured') && p.status === 'ativo');
  const propertyTypes = getPropertyTypes();
  const showReviews = agent.siteSettings?.showReviews ?? true;
  const whatsAppLink = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp');

  return (
    <>
      <main className="min-h-screen">
        <div className="relative mb-8">
          <Hero heroImageUrl={heroImageUrl}>
            <PropertyFilters 
              agent={{...agent, cities: citiesForFilter}} 
              propertyTypes={propertyTypes} 
              onSearch={handleSearch}
            />
          </Hero>
        </div>

        <AnimatePresence>
            {searchResults !== null && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-muted overflow-hidden mt-28"
                >
                    <div className="container mx-auto px-4 py-16">
                        <div className="flex justify-between items-center mb-8">
                             <h2 className="text-3xl font-bold font-headline">Resultados da Busca ({searchResults.length})</h2>
                             <Button variant="ghost" onClick={clearSearch}>
                                 <X className="mr-2 h-4 w-4" />
                                 Ocultar Resultados
                             </Button>
                        </div>
                        <SearchResultsContent properties={searchResults} />
                    </div>
                </motion.section>
            )}
        </AnimatePresence>

        <div className={searchResults !== null ? 'pt-16' : 'pt-24 md:pt-36'}>
            {featuredProperties.length > 0 && (
              <FeaturedProperties properties={featuredProperties} agent={agent} />
            )}

            {customSections.map(section => {
              const sectionProperties = allProperties.filter(p => (p.sectionIds || []).includes(section.id) && p.status === 'ativo');
              if (sectionProperties.length === 0) return null;
              return (
                <CustomPropertySection
                  key={section.id}
                  title={section.title}
                  properties={sectionProperties}
                  agent={agent}
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
        </div>

        {whatsAppLink && <FloatingContactButton whatsAppLink={whatsAppLink} agent={agent} />}
      </main>
    </>
  );
}
