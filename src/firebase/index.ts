'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInAnonymously, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult, 
    type User 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// This function ensures Firebase is initialized only once.
function initializeFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Correctly initialize and return Firebase services
export function initializeFirebase() {
  const firebaseApp = initializeFirebaseApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const googleProvider = new GoogleAuthProvider();

  return {
    firebaseApp,
    auth,
    firestore,
    googleProvider,
  };
}

interface AdditionalAgentData {
    displayName?: string | null;
    name?: string | null;
    accountType?: 'corretor' | 'imobiliaria';
}

export const saveUserToFirestore = async (user: User, additionalData?: AdditionalAgentData) => {
    // We need a valid firestore instance from the initialized app.
    const { firestore } = initializeFirebase();
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


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';

// Re-exporting auth functions for convenience
export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult };