
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useAuth, getRedirectResult, saveUserToFirestore } from '@/firebase';
import { PlanProvider } from '@/context/PlanContext';

interface Props {
  children: React.ReactNode;
}

export function Providers({ children }: Props) {
  const router = useRouter();
  const auth = useAuth();

  // Trata o resultado do redirect do Google (após signInWithRedirect)
  useEffect(() => {
    if (!auth) return;

    let mounted = true;
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!mounted) return;

        if (result && result.user) {
          // Salva/garante o documento no Firestore
          try {
            await saveUserToFirestore(result.user, {
              displayName: result.user.displayName ?? undefined,
              name: result.user.displayName ?? undefined,
              accountType: 'corretor',
            });
          } catch (e) {
            console.error('Erro ao salvar usuário após redirect:', e);
          }

          // Redireciona para a tela de seleção de usuário
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

  // Envolvemos toda a aplicação com os providers
  return (
    <FirebaseClientProvider>
      <PlanProvider>
        {children}
      </PlanProvider>
    </FirebaseClientProvider>
  );
}
