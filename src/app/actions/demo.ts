
'use server';

import { getFirebaseServer } from "@/firebase/server-init";

/**
 * Fetches the demo account credentials from a protected Firestore document.
 * This function runs only on the server and is safe to use from client components.
 */
export async function getDemoCredentials(): Promise<{ email?: string; password?: string; error?: string }> {
  try {
    const { firestore } = getFirebaseServer();
    const settingsRef = firestore.collection('systemSettings').doc('demoAccount');
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      const errorMsg = "As configurações da conta de demonstração não foram encontradas no Firestore.";
      console.error(errorMsg);
      return { error: errorMsg };
    }

    const { email, password } = settingsSnap.data()!;

    if (!email || !password) {
        const errorMsg = "As credenciais da conta de demonstração estão incompletas no Firestore.";
        console.error(errorMsg);
        return { error: errorMsg };
    }
    
    return { email, password };
  } catch (error) {
    const errorMsg = "Falha ao buscar as credenciais do servidor.";
    console.error("Server Action Error: Falha ao buscar credenciais da demo:", error);
    return { error: errorMsg };
  }
}
