'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let firebaseApp: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let firestore: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

// This function ensures Firebase is initialized only once.
export function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp, `gs://${firebaseConfig.storageBucket}`);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp, `gs://${firebaseConfig.storageBucket}`);
  }
  return { firebaseApp, auth, firestore, storage };
}

interface AdditionalAgentData {
    displayName?: string | null;
    name?: string | null;
    accountType?: 'corretor' | 'imobiliaria';
}

export const saveUserToFirestore = async (user: User, additionalData?: AdditionalAgentData) => {
    const { firestore } = initializeFirebase(); // Get a fresh instance here
    if (!user?.uid || !firestore) return;

    const userRef = doc(firestore, "agents", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const agentData = {
            id: user.uid,
            displayName: additionalData?.displayName || user.displayName || 'Corretor sem nome',
            name: additionalData?.name || user.displayName || 'Imóveis', // Default site name
            accountType: additionalData?.accountType || 'corretor',
            description: "Edite sua descrição na seção Perfil do seu painel.",
            email: user.email,
            creci: '000000-F',
            photoUrl: user.photoURL || '',
            role: 'corretor',
            plan: 'corretor',
            createdAt: serverTimestamp(),
            siteSettings: {
                siteStatus: true,
                showFinancing: true,
                showReviews: true,
                theme: 'dark',
            }
        };
        await setDoc(userRef, agentData);
        console.log("Novo usuário criado no Firestore");
    }
};

export const googleProvider = new GoogleAuthProvider();

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';

// Re-exporting auth functions for convenience
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult };