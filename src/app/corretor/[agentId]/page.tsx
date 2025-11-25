'use client';
import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { getReviews as getStaticReviews, getProperties as getStaticProperties } from '@/lib/data';
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function AgentPublicPageSkeleton() {
  return (
    <div className="space-y-8">
        <Skeleton className="h-[70vh] w-full" />
        <div className="container space-y-12">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    </div>
  )
}


export default function AgentPublicPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(true);
  
  // Real-time listeners for all data
  const agentRef = useMemoFirebase(() => firestore && agentId ? doc(firestore, 'agents', agentId) : null, [firestore, agentId]);
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  const propertiesQuery = useMemoFirebase(() => firestore && agentId ? query(collection(firestore, `agents/${agentId}/properties`), where('status', '==', 'ativo')) : null, [firestore, agentId]);
  const { data: propertiesData, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesQuery);

  const sectionsQuery = useMemoFirebase(() => firestore && agentId ? query(collection(firestore, `agents/${agentId}/customSections`), orderBy('order', 'asc')) : null, [firestore, agentId]);
  const { data: sectionsData, isLoading: areSectionsLoading } = useCollection<CustomSection>(sectionsQuery);
  
  const reviewsQuery = useMemoFirebase(() => firestore && agentId ? query(collection(firestore, `agents/${agentId}/reviews`), where('approved', '==', true), limit(10)) : null, [firestore, agentId]);
  const { data: reviewsData, isLoading: areReviewsLoading } = useCollection<Review>(reviewsQuery);


  useEffect(() => {
    const totalLoading = isAgentLoading || arePropertiesLoading || areSectionsLoading || areReviewsLoading;
    setIsLoading(totalLoading);
  }, [isAgentLoading, arePropertiesLoading, areSectionsLoading, areReviewsLoading]);


  if (!isAgentLoading && (!agentData || agentData.siteSettings?.siteStatus === false)) {
    return notFound();
  }

  // Use static fallback data ONLY if the agent has none of their own.
  const allProperties = propertiesData && propertiesData.length > 0 ? propertiesData : getStaticProperties().map(p => ({...p, agentId}));
  const reviews = reviewsData && reviewsData.length > 0 ? reviewsData : getStaticReviews();
  const customSections = sectionsData || [];


  if (isLoading && agentId !== 'exemplo') { // Don't show skeleton for the static example page
      return <AgentPublicPageSkeleton />;
  }

  return <AgentPageClient 
            agent={agentData}
            allProperties={allProperties}
            customSections={customSections}
            reviews={reviews}
         />;
}
