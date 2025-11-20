
'use client';

import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Property, Agent } from "@/lib/data";
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PropertyView } from '@/components/imovel/PropertyView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirestore, useDemo } from '@/firebase';
import { RelatedProperties } from '@/components/imovel/RelatedProperties';
import { getProperties as getStaticProperties, getAgent as getStaticAgent } from '@/lib/data';


function BackButton() {
    const router = useRouter();
    return (
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
    );
}

async function getPropertyAndAgent(firestore: any, agentId: string, imovelId: string): Promise<{ property: Property | null; agent: Agent | null; allProperties: Property[] }> {
    if (!firestore || !agentId || !imovelId) {
        return { property: null, agent: null, allProperties: [] };
    }

    try {
        const agentRef = doc(firestore, 'agents', agentId);
        const propertyRef = doc(firestore, `agents/${agentId}/properties`, imovelId);
        
        // Fetch related properties in parallel
        const allPropertiesQuery = query(collection(firestore, `agents/${agentId}/properties`), where('status', '==', 'ativo'));
        
        const [agentSnap, propertySnap, allPropertiesSnap] = await Promise.all([
          getDoc(agentRef),
          getDoc(propertyRef),
          getDocs(allPropertiesQuery)
        ]);

        let property: Property | null = null;
        if (propertySnap.exists()) {
            property = { id: propertySnap.id, ...(propertySnap.data() as Omit<Property, 'id'>), agentId: agentId };
        }

        let agent: Agent | null = null;
        if (agentSnap.exists()) {
            agent = { id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, 'id'>) };
        }

        let allProperties: Property[] = [];
        if (!allPropertiesSnap.empty) {
            allProperties = allPropertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }));
        }

        return { property, agent, allProperties };

    } catch (error) {
        console.error("Error fetching property and agent:", error);
        return { property: null, agent: null, allProperties: [] };
    }
}


export default function PropertyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { isDemo, demoData } = useDemo();
  
  const imovelId = params.imovelId as string;
  const agentId = isDemo ? demoData.agent.id : searchParams.get('agentId');
  
  const [propertyData, setPropertyData] = useState<Property | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();


  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);

        if (isDemo && demoData) {
            const demoProp = demoData.properties.find(p => p.id === imovelId);
            setPropertyData(demoProp || null);
            setAgentData(demoData.agent);
            setAllProperties(demoData.properties);
        } else {
            if (!agentId || !firestore) {
              const staticProp = getStaticProperties().find(p => p.id === imovelId);
              if (staticProp) {
                setPropertyData(staticProp);
                setAgentData(getStaticAgent());
                setAllProperties(getStaticProperties());
              }
            } else {
                const { property, agent, allProperties } = await getPropertyAndAgent(firestore, agentId, imovelId);
                setPropertyData(property);
                setAgentData(agent);
                setAllProperties(allProperties);
            }
        }
        setIsLoading(false);
    };
    
    fetchData();

  }, [firestore, agentId, imovelId, isDemo, demoData]);

  if (isLoading) {
    return (
      <>
        <Header agentId={isDemo ? 'demo-user-arthur' : agentId || undefined} />
        <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
             <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        </main>
        <Footer agentId={isDemo ? 'demo-user-arthur' : agentId || undefined} />
      </>
    );
  }

  if (!propertyData || !agentData) {
    return notFound();
  }

  return (
    <>
      <Header agent={agentData} agentId={isDemo ? 'demo-user-arthur' : agentId || undefined} />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
        <BackButton />
        <PropertyView property={propertyData} agent={agentData} />
      </main>
      <RelatedProperties currentProperty={propertyData} allProperties={allProperties} />
      <Footer agentId={isDemo ? 'demo-user-arthur' : agentId || undefined} />
    </>
  );
}
