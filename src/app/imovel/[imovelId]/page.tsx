
'use client';

import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import type { Property } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PropertyView } from '@/components/imovel/PropertyView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';

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

export default function PropertyPage({ params, searchParams }: Props) {
  const { imovelId } = params;
  const agentId = searchParams.agentId as string;
  const [propertyData, setPropertyData] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();


  useEffect(() => {
    if (!agentId || !imovelId || !firestore) {
        setIsLoading(false);
        return;
    }

    const fetchProperty = async () => {
        setIsLoading(true);
        try {
            const propertyRef = doc(firestore, `agents/${agentId}/properties`, imovelId);
            const docSnap = await getDoc(propertyRef);

            if (docSnap.exists()) {
                setPropertyData({ id: docSnap.id, ...(docSnap.data() as Omit<Property, 'id'>), agentId: agentId });
            } else {
                setPropertyData(null);
            }
        } catch (error) {
            console.error("Erro ao buscar imóvel:", error);
            setPropertyData(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchProperty();

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

  if (!propertyData) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
        <BackButton />
        <PropertyView property={propertyData} />
      </main>
      <Footer />
    </>
  );
}
