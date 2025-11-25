'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseApp = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider firebaseApp={firebaseApp}>
      {children}
    </FirebaseProvider>
  );
}
