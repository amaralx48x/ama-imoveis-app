
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useDemo } from '@/context/DemoContext';

export default function DemoRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDemo, startDemo } = useDemo();

  useEffect(() => {
    const demoParam = searchParams.get('demo');
    if (demoParam === 'true' && !isDemo) {
      startDemo();
      router.replace('/dashboard');
    }
  }, [router, searchParams, isDemo, startDemo]);

  return null;
}
