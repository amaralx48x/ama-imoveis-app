
'use client';
import { useEffect, useState } from 'react';
import type { Metadata } from "next";
import AgentPageClient from "@/app/corretor/[agentId]/agent-page-client";
import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import type { Agent, Property, Review, CustomSection } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { getReviews as getStaticReviews, getProperties as getStaticProperties } from '@/lib/data';
import { getSEO } from "@/firebase/server-actions/seo";
import { useDemo } from '@/context/DemoContext';
import { useFirestore } from '@/firebase';

async function getAgentDataServer(agentId: string) {
  const { firestore } = getFirebaseServer();
  
  const agentRef = doc(firestore, 'agents', agentId);
  const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
  const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);
  const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);

  try {
    const [agentSnap, propertiesSnap, sectionsSnap, reviewsSnap] = await Promise.all([
      getDoc(agentRef),
      getDocs(query(propertiesRef, where('status', '==', 'ativo'))),
      getDocs(query(sectionsRef, orderBy('order', 'asc'))),
      getDocs(query(reviewsRef, where('approved', '==', true), limit(10))),
    ]);

    if (!agentSnap.exists() || (agentSnap.data() as Agent).siteSettings?.siteStatus === false) {
      return null;
    }

    const agent = { id: agentSnap.id, ...agentSnap.data() } as Agent;
    
    let allProperties: Property[];
    if (!propertiesSnap.empty) {
        allProperties = propertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }) as Property);
    } else {
        allProperties = getStaticProperties().map(p => ({...p, agentId}));
    }
    
    const customSections = sectionsSnap.docs.map(d => ({ ...(d.data() as Omit<CustomSection, 'id'>), id: d.id }) as CustomSection);

    let reviews: Review[];
    if (!reviewsSnap.empty) {
      const fetchedReviews = reviewsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as Omit<Review, 'id' | 'createdAt'>),
          id: doc.id,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        };
      });
      fetchedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      reviews = fetchedReviews;
    } else {
      reviews = getStaticReviews();
    }

    return { 
        agent: JSON.parse(JSON.stringify(agent)),
        allProperties: JSON.parse(JSON.stringify(allProperties)), 
        customSections: JSON.parse(JSON.stringify(customSections)),
        reviews: JSON.parse(JSON.stringify(reviews)),
    };

  } catch (error) {
    console.error("Failed to fetch agent data on server:", error);
    return null;
  }
}

export default function AgentPublicPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { isDemo, demoData, isLoading: isDemoLoading } = useDemo();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      let fetchedData;
      if (isDemo && agentId === 'demo-user-arthur') {
        // In demo mode, use the data from context
        fetchedData = {
          agent: demoData.agent,
          allProperties: demoData.properties.filter(p => p.status === 'ativo'),
          customSections: demoData.customSections,
          reviews: demoData.reviews.filter(r => r.approved),
        };
      } else if (!isDemo) {
        // In live mode, fetch from server (this part is tricky on client)
        // For simplicity, we'll keep the client-side fetch for live mode too.
        // This deviates from SSR but makes demo/live switching easier in one component.
        const serverData = await getAgentDataServer(agentId);
        fetchedData = serverData;
      }
      setData(fetchedData);
      setIsLoading(false);
    };

    if (!isDemoLoading) {
       fetchData();
    }
  }, [agentId, isDemo, isDemoLoading, demoData]);

  if (isLoading || isDemoLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      </div>
    );
  }
  
  if (!data) {
    return notFound();
  }

  return <AgentPageClient {...data} />;
}
