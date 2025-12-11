'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function BackButtonComponent() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  if (from === 'dashboard') {
    return (
      <Button variant="outline" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Dashboard
        </Link>
      </Button>
    );
  }

  return null;
}

export function BackToDashboardButton() {
    return (
        <Suspense fallback={null}>
            <BackButtonComponent />
        </Suspense>
    )
}
