'use client';

import React, { useMemo, type ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// O contexto agora simplesmente armazena os serviços
export const FirebaseServicesContext = React.createContext<FirebaseServices | null>(null);

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Este provedor é responsável APENAS por inicializar os serviços do Firebase
 * no lado do cliente e disponibilizá-los via um contexto simples.
 * Ele NÃO renderiza mais o FirebaseProvider diretamente.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseServicesContext.Provider value={firebaseServices}>
      {children}
    </FirebaseServicesContext.Provider>
  );
}
