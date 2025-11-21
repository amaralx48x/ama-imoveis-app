
// IMPORTANT: This file should NOT have the 'use client' directive.
// It's intended for server-side use only.
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Ensure the process.env variables are read (this might be necessary in some environments)
import 'dotenv/config';

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.PROJECT_ID || firebaseConfig.projectId,
  clientEmail: process.env.CLIENT_EMAIL || '',
  privateKey: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

/**
 * Initializes and returns Firebase Admin services for server-side usage.
 * Ensures that the app is initialized only once.
 */
export function getFirebaseServer() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: firebaseConfig.databaseURL,
    });
  }
  
  return {
    firebaseApp: admin.apps[0]!,
    auth: admin.auth(),
    firestore: admin.firestore()
  };
}
