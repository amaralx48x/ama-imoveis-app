
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
import { getProperties as getStaticProperties } from '@/lib/data';

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
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();


  useEffect(() => {
    if (!imovelId || !firestore) {
        setIsLoading(false);
        return;
    }

    const fetchPropertyAndAgent = async () => {
        setIsLoading(true);
        let property: Property | null = null;
        let agent: Agent | null = null;
        let relatedProps: Property[] = [];

        try {
            // Se houver um agentId, buscamos no Firestore primeiro.
            if (agentId) {
                const agentRef = doc(firestore, 'agents', agentId);
                const propertyRef = doc(firestore, `agents/${agentId}/properties`, imovelId);
                const allPropertiesQuery = query(collection(firestore, `agents/${agentId}/properties`), where('status', '==', 'ativo'));
                
                const [agentSnap, propertySnap, allPropertiesSnap] = await Promise.all([
                  getDoc(agentRef),
                  getDoc(propertyRef),
                  getDocs(allPropertiesQuery)
                ]);

                if (propertySnap.exists()) {
                    property = { id: propertySnap.id, ...(propertySnap.data() as Omit<Property, 'id'>), agentId: agentId };
                }

                if (agentSnap.exists()) {
                    agent = { id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, 'id'>) };
                }

                if (!allPropertiesSnap.empty) {
                    relatedProps = allPropertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }));
                }
            }

            // Fallback para dados estáticos se não encontrado no Firestore ou se for imóvel de exemplo
            if (!property) {
                const staticProperties = getStaticProperties();
                const staticProp = staticProperties.find(p => p.id === imovelId);
                if (staticProp) {
                    property = { ...staticProp, agentId: agentId || 'exemplo' }; // Garante agentId para o link
                    // Se o corretor não foi encontrado, usamos um mock para os exemplos
                    if (!agent && agentId) {
                         const agentRef = doc(firestore, 'agents', agentId);
                         const agentSnap = await getDoc(agentRef);
                         if(agentSnap.exists()){
                            agent = { id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, 'id'>) };
                         }
                    }
                    relatedProps = staticProperties;
                }
            }

            setPropertyData(property);
            setAgentData(agent);
            setAllProperties(relatedProps);

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
        <Header agentId={agentId || undefined} />
        <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
             <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        </main>
        <Footer agentId={agentId || undefined} />
      </>
    );
  }

  if (!propertyData || !agentData) {
    notFound();
  }

  return (
    <>
      <Header agent={agentData} agentId={agentId || undefined} />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
        <BackButton />
        <PropertyView property={propertyData} agent={agentData} />
      </main>
      <RelatedProperties currentProperty={propertyData} allProperties={allProperties} />
      <Footer agentId={agentId || undefined} />
    </>
  );
}
