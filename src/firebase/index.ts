
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// This function ensures Firebase is initialized only once.
function initializeFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const firebaseApp = initializeFirebaseApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp); 

  const googleProvider = new GoogleAuthProvider();

  return {
    firebaseApp,
    auth,
    firestore,
    storage,
    googleProvider
  };
}

export const { auth, firestore, storage, googleProvider } = initializeFirebase();

interface AdditionalAgentData {
  displayName?: string | null;
  name?: string | null;
  accountType?: 'corretor' | 'imobiliaria';
}

export const saveUserToFirestore = async (user: User, additionalData?: AdditionalAgentData) => {
  if (!user?.uid || !firestore) return;

  const userRef = doc(firestore, "agents", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const isGoogleSignUp = !additionalData?.name; // Heurística: se não houver nome, provavelmente é do Google.
    
    const agentData = {
      id: user.uid,
      displayName: additionalData?.displayName || user.displayName || 'Corretor sem nome',
      name: additionalData?.name || user.displayName || 'Imóveis',
      pin: '0000',
      accountType: additionalData?.accountType || 'corretor',
      description: "Edite sua descrição na seção Perfil do seu painel.",
      email: user.email,
      creci: '000000-F',
      photoUrl: user.photoURL || '',
      role: 'corretor',
      plan: 'simples' as const,
      createdAt: serverTimestamp(),
      status: isGoogleSignUp ? 'pending' : 'active', // Define status como 'pending' para novos cadastros Google
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
export * from './error-emitter';

// Re-exporting auth functions
export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
};
