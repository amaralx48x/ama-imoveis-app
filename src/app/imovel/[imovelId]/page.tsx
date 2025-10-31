import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PropertyView } from '@/components/imovel/PropertyView';
import { getSdks } from '@/firebase'; // Using a server-compatible function
import { doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Property } from '@/lib/data';


// Helper function to initialize Firebase admin-side without hooks
function getFirebaseServer() {
  if (getApps().length) {
    return getSdks(getApps()[0]);
  }
  const app = initializeApp(firebaseConfig);
  return getSdks(app);
}

// This is now a Server Component responsible for data fetching
export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: { imovelId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { imovelId } = params;
  const agentId = searchParams.agentId as string;

  // If we don't have the IDs, we can't find the property.
  if (!agentId || !imovelId) {
    notFound();
  }

  const { firestore } = getFirebaseServer();

  const propertyRef = doc(firestore, `agents/${agentId}/properties`, imovelId);
  
  let property: Property | null = null;
  try {
    const propertySnap = await getDoc(propertyRef);

    if (propertySnap.exists()) {
      property = { id: propertySnap.id, ...propertySnap.data() } as Property;
    }
  } catch (error) {
    console.error("Error fetching property:", error);
    // This could be a 500 error page in a real app
    notFound();
  }

  // If after fetching, the property is not found, show 404.
  if (!property) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        {/* The PropertyView component now just receives data and displays it */}
        <PropertyView property={property} />
      </main>
      <Footer />
    </>
  );
}
