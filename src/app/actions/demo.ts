
'use server';

import { getFirebaseServer } from "@/firebase/server-init";
import { doc, getDoc } from "firebase/firestore";

/**
 * Fetches the demo account credentials from a protected Firestore document.
 * This function runs only on the server and is safe to use from client components.
 */
export async function getDemoCredentials() {
  try {
    const { firestore } = getFirebaseServer();
    const settingsRef = doc(firestore, 'systemSettings', 'demoAccount');
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      console.error("As configurações da conta de demonstração não foram encontradas no Firestore.");
      return { error: "Configuração da demo não encontrada." };
    }

    const { email, password } = settingsSnap.data();

    if (!email || !password) {
        console.error("As credenciais da conta de demonstração estão incompletas no Firestore.");
        return { error: "Credenciais da demo incompletas." };
    }
    
    return { email, password };
  } catch (error) {
    console.error("Server Action Error: Falha ao buscar credenciais da demo:", error);
    return { error: "Falha ao buscar as credenciais do servidor." };
  }
}
