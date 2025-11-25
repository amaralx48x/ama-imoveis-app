
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider é um wrapper simples para o FirebaseProvider no lado do cliente.
 * Sua única responsabilidade é renderizar o FirebaseProvider, que agora contém
 * toda a lógica de inicialização e gerenciamento de estado.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
