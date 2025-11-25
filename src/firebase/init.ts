
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
 * Garante que o Firebase App seja inicializado apenas uma vez (padrão Singleton).
 * Retorna a instância única do FirebaseApp.
 */
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  return firebaseApp;
}

/**
 * Ponto de entrada centralizado para inicializar e obter todos os serviços Firebase.
 * Usa o padrão singleton para garantir que cada serviço seja instanciado apenas uma vez.
 * @returns Um objeto contendo todas as instâncias de serviço do Firebase.
 */
export function initializeFirebase() {
  // Inicializa o app principal (ou obtém a instância existente)
  const app = getFirebaseApp();

  // Usa getService para obter instâncias singleton de cada serviço
  // Se a instância já existir, ela será retornada; caso contrário, será criada.
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);

  return { firebaseApp: app, auth, firestore, storage };
}
