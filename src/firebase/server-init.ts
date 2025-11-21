
// IMPORTANT: This file should NOT have the 'use client' directive.
// It's intended for server-side use only.
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import 'dotenv/config';

function isServiceAccount(obj: any): obj is admin.ServiceAccount {
  return obj && typeof obj.projectId === 'string' && typeof obj.clientEmail === 'string' && typeof obj.privateKey === 'string';
}

function getServiceAccount(): admin.ServiceAccount | undefined {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountString) {
        try {
            const parsed = JSON.parse(serviceAccountString);
            if (isServiceAccount(parsed)) {
                return parsed;
            }
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", e);
        }
    }
    
    // Fallback to individual environment variables if the JSON is not available
    const serviceAccount = {
      projectId: process.env.PROJECT_ID || firebaseConfig.projectId,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    if (isServiceAccount(serviceAccount)) {
        return serviceAccount;
    }
    
    return undefined;
}


/**
 * Initializes and returns Firebase Admin services for server-side usage.
 * Ensures that the app is initialized only once.
 */
export function getFirebaseServer() {
  if (admin.apps.length === 0) {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: firebaseConfig.databaseURL,
        });
    } else {
        // Fallback initialization without credentials for environments where it might not be needed
        // or where default application credentials are used.
        console.warn("Firebase Admin SDK is initializing without explicit credentials. This might fail in some environments.");
        admin.initializeApp({
            projectId: firebaseConfig.projectId,
            databaseURL: firebaseConfig.databaseURL,
        });
    }
  }
  
  return {
    firebaseApp: admin.apps[0]!,
    auth: admin.auth(),
    firestore: admin.firestore()
  };
}
