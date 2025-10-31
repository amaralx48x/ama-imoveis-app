
import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PropertyView, LoadingSkeleton } from '@/components/imovel/PropertyView';

// This is now a Server Component. Its only job is to get the `imovelId`
// from the URL parameters and pass it down to the Client Component.
export default function PropertyPage({ params }: { params: { imovelId: string } }) {
  const { imovelId } = params;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <Suspense fallback={<LoadingSkeleton />}>
          {/* We pass the resolved imovelId as a prop to the client component */}
          <PropertyView imovelId={imovelId} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
