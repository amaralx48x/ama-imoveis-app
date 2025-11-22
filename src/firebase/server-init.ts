// IMPORTANT: This file should NOT have the 'use client' directive.
// It's intended for server-side use only.
import * as admin from 'firebase-admin';

/**
 * Initializes and returns Firebase Admin services for server-side usage.
 * Ensures that the app is initialized only once.
 * In a Google Cloud environment (like Cloud Run, Cloud Functions, App Engine, or Studio),
 * the SDK can automatically detect the service account credentials.
 */
export function getFirebaseServer() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  
  return {
    firebaseApp: admin.apps[0]!,
    auth: admin.auth(),
    firestore: admin.firestore()
  };
}
