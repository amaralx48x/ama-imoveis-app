// IMPORTANT: This file should NOT have the 'use client' directive.
// It's intended for server-side use only.

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Initializes and returns Firebase services for server-side usage.
 * Ensures that the app is initialized only once.
 */
export function getFirebaseServer() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}
