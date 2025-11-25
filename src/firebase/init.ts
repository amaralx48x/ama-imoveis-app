
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Declare as instâncias de serviço em um escopo mais amplo
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

/**
 * Ponto de entrada centralizado para inicializar e obter todos os serviços Firebase.
 * Usa o padrão singleton para garantir que cada serviço seja instanciado apenas uma vez.
 * @returns Um objeto contendo todas as instâncias de serviço do Firebase.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  storage = getStorage(firebaseApp);

  return { firebaseApp, auth, firestore, storage };
}
