// src/firebase/seo.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase";

export async function getSEO(page: string) {
  const ref = doc(firestore, "seo", page);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveSEO(page: string, data: any) {
  const ref = doc(firestore, "seo", page);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
