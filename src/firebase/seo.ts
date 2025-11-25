'use client';
// src/firebase/seo.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeFirebase } from "@/firebase/init";
import { errorEmitter } from "./error-emitter";
import { FirestorePermissionError } from "./errors";

// Função para ser usada no LADO DO CLIENTE (ex: formulário de edição)
export async function saveSEOClient(page: string, data: any) {
  const { firestore } = initializeFirebase();
  const ref = doc(firestore, "seo", page);
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
