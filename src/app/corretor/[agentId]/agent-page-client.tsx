
'use client';

import { useMemo, useState } from 'react';
import type { Agent, Property, Review, CustomSection } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/hero";
import { AgentPageContent } from '@/components/agent-page-content';
import { AgentProfile } from '@/components/agent-profile';
import { ClientReviews } from '@/components/client-reviews';
import { FloatingContactButton } from '@/components/floating-contact-button';


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

  if (!agent) {
    return notFound();
  }

  const heroImageUrl = agent.siteSettings?.heroImageUrl;
  const showReviews = agent.siteSettings?.showReviews ?? true;
  const whatsAppLink = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp');

  return (
    <>
      <Header agent={agent} agentId={agent.id} />
      <main className="min-h-screen">
        <div className="relative mb-24 md:mb-36">
          <Hero heroImageUrl={heroImageUrl}>
            {/* The PropertyFilters component is now inside AgentPageContent */}
          </Hero>
        </div>

        <AgentPageContent allProperties={allProperties} agent={agent} />

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
