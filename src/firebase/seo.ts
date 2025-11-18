// src/firebase/seo.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase";
import { errorEmitter } from "./error-emitter";
import { FirestorePermissionError } from "./errors";

export async function getSEO(page: string) {
  const ref = doc(firestore, "seo", page);
  try {
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: ref.path,
      operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function saveSEO(page: string, data: any) {
  const ref = doc(firestore, "seo", page);
  const dataToSave = { ...data, updatedAt: serverTimestamp() };
  try {
    await setDoc(ref, dataToSave, { merge: true });
  } catch (serverError) {
     const permissionError = new FirestorePermissionError({
        path: ref.path,
        operation: 'update', // or 'create' depending on logic
        requestResourceData: dataToSave,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}
