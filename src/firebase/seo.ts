
// src/firebase/seo.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseServer } from "./server-init"; // Usar a inicialização do servidor
import { firestore as clientFirestore } from "@/firebase"; // Manter uma referência ao firestore do cliente para as funções do cliente
import { errorEmitter } from "./error-emitter";
import { FirestorePermissionError } from "./errors";

// Função para ser usada no LADO DO SERVIDOR (ex: generateMetadata)
export async function getSEO(page: string) {
  const { firestore: serverFirestore } = getFirebaseServer();
  const ref = doc(serverFirestore, "seo", page);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Função para ser usada no LADO DO CLIENTE (ex: formulário de edição)
export async function saveSEO(page: string, data: any) {
  const ref = doc(clientFirestore, "seo", page);
  const dataToSave = { ...data, updatedAt: serverTimestamp() };
  try {
    await setDoc(ref, dataToSave, { merge: true });
  } catch (serverError) {
     const permissionError = new FirestorePermissionError({
        path: ref.path,
        operation: 'update',
        requestResourceData: dataToSave,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
