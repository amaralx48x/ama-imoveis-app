
'use client';
import type { Metadata } from "next";
import { useState, useEffect } from "react";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { getReviews as getStaticReviews, getProperties as getStaticProperties } from '@/lib/data';
import { Skeleton } from "@/components/ui/skeleton";


function AgentPageSkeleton() {
  return (
    <div className="w-full">
      <header className="sticky top-0 z-50 h-14 border-b bg-background/95">
        <div className="container flex items-center justify-between h-full">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>
      <main>
        <div className="relative h-[70vh]">
          <Skeleton className="h-full w-full" />
          <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 z-20'>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
        <div className="pt-32 pb-16">
          <div className="container">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


export default function AgentPublicPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const firestore = useFirestore();
  
  const isExample = agentId === 'exemplo';
  
  const agentRef = useMemoFirebase(() => {
      if (isExample || !firestore || !agentId) return null;
      return doc(firestore, 'agents', agentId);
  }, [firestore, agentId, isExample]);

  const propertiesQuery = useMemoFirebase(() => {
      if (isExample || !firestore || !agentId) return null;
      return query(collection(firestore, `agents/${agentId}/properties`), where('status', '==', 'ativo'));
  }, [firestore, agentId, isExample]);
  
  const sectionsQuery = useMemoFirebase(() => {
      if (isExample || !firestore || !agentId) return null;
      return query(collection(firestore, `agents/${agentId}/customSections`), orderBy('order', 'asc'));
  }, [firestore, agentId, isExample]);
  
  const reviewsQuery = useMemoFirebase(() => {
      if (isExample || !firestore || !agentId) return null;
      return query(collection(firestore, `agents/${agentId}/reviews`), where('approved', '==', true), limit(10));
  }, [firestore, agentId, isExample]);


  const { data: agent, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);
  const { data: allProperties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);
  const { data: customSections, isLoading: areSectionsLoading } = useCollection<CustomSection>(sectionsQuery);
  const { data: reviews, isLoading: areReviewsLoading } = useCollection<Review>(reviewsQuery);
  
  const [clientData, setClientData] = useState<any>(null);
  
  useEffect(() => {
    if (isExample) {
        const exampleAgent: Agent = {
          id: 'exemplo',
          displayName: 'Corretor Exemplo',
          name: 'Imóveis Exemplo',
          accountType: 'corretor',
          description: 'Este é um perfil de demonstração para mostrar como seu site público pode parecer. Todas as informações e imóveis aqui são fictícios.',
          email: 'contato@exemplo.com',
          creci: '000000-F',
          photoUrl: 'https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjE5NTYzOTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          siteSettings: {
              showReviews: true,
              socialLinks: [
                  { id: '1', label: 'WhatsApp', url: '5511999999999', icon: 'whatsapp' },
                  { id: '2', label: 'Instagram', url: 'seu_usuario', icon: 'instagram' },
              ]
          }
        };
        setClientData({
            agent: exampleAgent,
            allProperties: getStaticProperties().map(p => ({...p, agentId: 'exemplo'})),
            customSections: [],
            reviews: getStaticReviews(),
        });
    } else if (!isAgentLoading && agent) {
        let finalProperties = allProperties;
        if (allProperties && allProperties.length === 0) {
            finalProperties = getStaticProperties().map(p => ({...p, agentId}));
        }

        let finalReviews = reviews;
        if (reviews && reviews.length === 0) {
            finalReviews = getStaticReviews();
        }

        setClientData({
            agent,
            allProperties: finalProperties,
            customSections: customSections || [],
            reviews: finalReviews,
        });
    } else if (!isAgentLoading && !agent) {
        setClientData({notFound: true});
    }
  }, [
    isExample, 
    agent, 
    allProperties, 
    customSections, 
    reviews, 
    isAgentLoading,
    agentId
  ]);
  
  const isLoading = isAgentLoading || arePropertiesLoading || areSectionsLoading || areReviewsLoading;
  
  // Handle not found case after loading is complete
  if (clientData?.notFound) {
    return notFound();
  }

  // Show loading skeleton while fetching data
  if (isLoading || !clientData) {
    return <AgentPageSkeleton />;
  }
  
  return <AgentPageClient {...clientData} />;
}
