
'use client';

// Barrel file para facilitar as importações.
// Este arquivo apenas re-exporta funcionalidades de outros módulos.

export * from './init';
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';

// Re-exportando funções de autenticação para conveniência
export { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInAnonymously, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult 
} from 'firebase/auth';

export { saveUserToFirestore, googleProvider } from './auth/user-actions';
