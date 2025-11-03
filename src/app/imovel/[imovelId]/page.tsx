
'use client';

import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Property, Agent } from '@/lib/data';
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PropertyView } from '@/components/imovel/PropertyView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { RelatedProperties } from '@/components/imovel/RelatedProperties';

function BackButton() {
    const router = useRouter();
    return (
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
    );
}

type Props = {
  params: { imovelId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function PropertyPage({ }: Props) {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const imovelId = params.imovelId as string;
  const agentId = searchParams.get('agentId');
  
  const [propertyData, setPropertyData] = useState<Property | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [allAgentProperties, setAllAgentProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();


  useEffect(() => {
    if (!agentId || !imovelId || !firestore) {
        setIsLoading(false);
        return;
    }

    const fetchPropertyAndAgent = async () => {
        setIsLoading(true);
        try {
            const agentRef = doc(firestore, 'agents', agentId);
            const propertyRef = doc(firestore, `agents/${agentId}/properties`, imovelId);
            const allPropertiesQuery = query(
                collection(firestore, `agents/${agentId}/properties`),
                where('status', 'not-in', ['vendido', 'alugado'])
            );
            
            const [agentSnap, propertySnap, allPropertiesSnap] = await Promise.all([
              getDoc(agentRef),
              getDoc(propertyRef),
              getDocs(allPropertiesQuery)
            ]);

            if (propertySnap.exists()) {
                setPropertyData({ id: propertySnap.id, ...(propertySnap.data() as Omit<Property, 'id'>), agentId: agentId });
            } else {
                setPropertyData(null);
            }

            if (agentSnap.exists()) {
                setAgentData({ id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, 'id'>) });
            } else {
                setAgentData(null);
            }

            if (!allPropertiesSnap.empty) {
                const props = allPropertiesSnap.docs.map(d => ({...d.data() as Property, id: d.id, agentId}));
                setAllAgentProperties(props);
            }


        } catch (error) {
            console.error("Erro ao buscar imóvel e corretor:", error);
            setPropertyData(null);
            setAgentData(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchPropertyAndAgent();

  }, [firestore, agentId, imovelId]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
             <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!propertyData || !agentData) {
    notFound();
  }

  return (
    <>
      <Header agentId={agentId} />
      <main className="min-h-screen container mx-auto px-4 py-8">
        <BackButton />
        <PropertyView property={propertyData} agent={agentData} />
        <RelatedProperties currentProperty={propertyData} allProperties={allAgentProperties} />
      </main>
      <Footer />
    </>
  );
}
