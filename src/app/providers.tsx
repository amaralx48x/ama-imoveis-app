
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useAuth, getRedirectResult, saveUserToFirestore, useUser } from '@/firebase';
import { PlanProvider } from '@/context/PlanContext';

interface Props {
  children: React.ReactNode;
}

// Inner component to safely use hooks that depend on FirebaseProvider
function AppProviders({ children }: Props) {
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser(); // Now this is safe to call

  // Trata o resultado do redirect do Google (após signInWithRedirect)
  useEffect(() => {
    if (!auth) return;

    let mounted = true;
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!mounted) return;

        if (result && result.user) {
          try {
            await saveUserToFirestore(result.user, {
              displayName: result.user.displayName ?? undefined,
              name: result.user.displayName ?? undefined,
              accountType: 'corretor',
            });
          } catch (e) {
            console.error('Erro ao salvar usuário após redirect:', e);
          }
          router.replace('/selecao-usuario');
        }
      } catch (err) {
        console.warn('getRedirectResult erro:', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth, router]);

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
