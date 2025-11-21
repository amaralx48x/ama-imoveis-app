'use client';

import React, { useMemo, type ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import { DemoProvider } from '@/context/DemoContext';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Este provedor é responsável por inicializar os serviços do Firebase
 * e então renderizar o FirebaseProvider, passando os serviços como props.
 * Isso garante que o Firebase seja inicializado uma vez e que o contexto
 * esteja corretamente disponível para os componentes filhos.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return React.cloneElement(children as React.ReactElement, firebaseServices);
}
