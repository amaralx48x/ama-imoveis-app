'use client';

import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Property, Agent } from '@/lib/data';
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PropertyView } from '@/components/imovel/PropertyView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { RelatedProperties } from '@/components/imovel/RelatedProperties';
import { getProperties as getStaticProperties } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

function BackButton() {
    const router = useRouter();
    return (
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
    );
}

function LoadingSkeleton() {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader className="p-0">
                        <Skeleton className="aspect-video w-full rounded-t-lg" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Skeleton className="h-6 w-1/4 mb-2" />
                        <Skeleton className="h-10 w-3/4 mb-2" />
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 my-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                        <Skeleton className="h-5 w-1/3 my-6" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card className="sticky top-24">
                    <CardContent className="pt-6 space-y-3">
                       <Skeleton className="h-8 w-full" />
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                       <div className="flex justify-center gap-3 pt-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-11 w-11 rounded-full" />)}
                       </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    )
}

export default function PropertyPage() {
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
                
                const [agentSnap, propertySnap] = await Promise.all([
                  getDoc(agentRef),
                  getDoc(propertyRef),
                ]);

                if (propertySnap.exists()) {
                    property = { id: propertySnap.id, ...(propertySnap.data() as Omit<Property, 'id'>), agentId: agentId };
                }

                if (agentSnap.exists()) {
                    agent = { id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, 'id'>) };
                    // If agent is found, fetch their properties for "related" section
                    const allPropertiesQuery = query(collection(firestore, `agents/${agentId}/properties`), where('status', '==', 'ativo'));
                    const allPropertiesSnap = await getDocs(allPropertiesQuery);
                    if (!allPropertiesSnap.empty) {
                        relatedProps = allPropertiesSnap.docs.map(d => ({ ...(d.data() as Omit<Property, 'id'>), id: d.id, agentId }));
                    }
                }
            }

            // Fallback para dados estáticos se não encontrado no Firestore ou se for imóvel de exemplo
            if (!property) {
                const staticProperties = getStaticProperties();
                const staticProp = staticProperties.find(p => p.id === imovelId);
                if (staticProp) {
                    property = { ...staticProp, agentId: agentId || 'exemplo' }; 
                    relatedProps = staticProperties;
                     // Se o corretor não foi encontrado, usamos um mock para os exemplos
                    if (!agent && agentId) {
                        if (agentId === 'exemplo') {
                             agent = { id: 'exemplo', name: 'Imóveis Exemplo' } as Agent;
                        } else {
                            const agentRef = doc(firestore, 'agents', agentId);
                            const agentSnap = await getDoc(agentRef);
                            if(agentSnap.exists()){
                                agent = { id: agentSnap.id, ...(agentSnap.data() as Omit<Agent, 'id'>) };
                            }
                        }
                    }
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
        <main className="min-h-screen">
          <LoadingSkeleton />
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
