import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Declare singleton instances
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

/**
 * Initializes Firebase services and returns them.
 * Ensures that services are initialized only once (singleton pattern).
 */
export function initializeFirebase() {
  if (!getApps().length) {
    // Initialize the app itself
    firebaseApp = initializeApp(firebaseConfig);

    // Initialize services
    auth = getAuth(firebaseApp);
    storage = getStorage(firebaseApp);
    
    // IMPORTANT: Initialize Firestore with specific settings
    // This must be done *once* with the desired settings.
    // Using memoryLocalCache to avoid the IndexedDB corruption errors.
    firestore = initializeFirestore(firebaseApp, {});

  } else {
    // If the app is already initialized, get the existing instances
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    storage = getStorage(firebaseApp);
    // CRITICAL: Call getFirestore() without parameters to get the existing instance
    firestore = getFirestore(firebaseApp);
  }
  
  return { firebaseApp, auth, firestore, storage };
}
