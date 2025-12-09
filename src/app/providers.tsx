
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useAuth, useUser } from '@/firebase';
import { PlanProvider } from '@/context/PlanContext';

interface Props {
  children: React.ReactNode;
}

// Inner component to safely use hooks that depend on FirebaseProvider
function AppProviders({ children }: Props) {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser(); // Now this is safe to call

  // A lógica para tratar o redirect do Google foi removida daqui
  // pois a funcionalidade foi desabilitada.

  return (
    <PlanProvider agentId={user?.uid || null}>
      {children}
    </PlanProvider>
  );
}


export function Providers({ children }: Props) {
  return (
    <FirebaseClientProvider>
      <AppProviders>{children}</AppProviders>
    </FirebaseClientProvider>
  );
}
