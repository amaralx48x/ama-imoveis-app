import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PropertyView, LoadingSkeleton } from '@/components/imovel/PropertyView';

export default async function PropertyPage({ params }: { params: Promise<{ imovelId: string }> }) {
  const { imovelId } = await params;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-theme(spacing.14)-theme(spacing.32))]">
        <Suspense fallback={<LoadingSkeleton />}>
          <PropertyView imovelId={imovelId} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
