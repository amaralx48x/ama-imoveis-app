
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc } from 'firebase/firestore';
import type { Property } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PropertyView } from '@/components/imovel/PropertyView';

type Props = {
  params: { imovelId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function PropertyPage({ params, searchParams }: Props) {
  const { imovelId } = params;
  const agentId = searchParams.agentId as string;

  if (!agentId || !imovelId) {
    notFound();
  }
  
  const { firestore } = getFirebaseServer();
  let propertyData: Property | null = null;

  try {
    const propertyRef = doc(firestore, `agents/${agentId}/properties`, imovelId);
    const docSnap = await getDoc(propertyRef);

    if (docSnap.exists()) {
      propertyData = { id: docSnap.id, ...(docSnap.data() as Omit<Property, 'id'>), agentId: agentId };
    }
  } catch (error) {
    console.error("Erro ao buscar imóvel:", error);
    // Em caso de erro na busca, podemos optar por mostrar 'não encontrado' também.
    notFound();
  }


  if (!propertyData) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))] container mx-auto px-4 py-8">
        <PropertyView property={propertyData} />
      </main>
      <Footer />
    </>
  );
}
