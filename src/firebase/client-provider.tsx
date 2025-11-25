'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './init'; // Import the centralized initializer

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The magic happens here: initializeFirebase is called once on the client
  // and returns the singleton instances of all services.
  const { firebaseApp, auth, firestore, storage } = useMemo(() => {
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    // Pass the singleton instances to the provider.
    <FirebaseProvider 
        firebaseApp={firebaseApp}
        auth={auth}
        firestore={firestore}
        storage={storage}
    >
      {children}
    </FirebaseProvider>
  );
}
