"use client";

import { addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { useFirestore, errorEmitter, FirestorePermissionError } from "./index";


export async function createContact(agentId: string, payload: any) {
  const firestore = useFirestore();
  if (!firestore) throw new Error("Firestore not initialized");

  const collRef = collection(firestore, "agents", agentId, "contacts");
  
  try {
    const docRef = await addDoc(collRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        linkedPropertyIds: [],
    });
    return { id: docRef.id, ...payload };
  } catch (serverError) {
      const permissionError = new FirestorePermissionError({
          path: collRef.path,
          operation: 'create',
          requestResourceData: payload,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  }
}

export async function updateContact(agentId: string, contactId: string, data: any) {
    const firestore = useFirestore();
    if (!firestore) throw new Error("Firestore not initialized");

    const ref = doc(firestore, "agents", agentId, "contacts", contactId);

    return await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteContact(agentId: string, contactId: string) {
    const firestore = useFirestore();
    if (!firestore) throw new Error("Firestore not initialized");

    const ref = doc(firestore, "agents", agentId, "contacts", contactId);

    return await deleteDoc(ref);
}

export async function linkContactToProperty(agentId: string, contactId: string, propertyId: string) {
    const firestore = useFirestore();
    if (!firestore) throw new Error("Firestore not initialized");
    const contactRef = doc(firestore, "agents", agentId, "contacts", contactId);
    const propertyRef = doc(firestore, "agents", agentId, "properties", propertyId);

    await updateDoc(contactRef, {
        linkedPropertyIds: arrayUnion(propertyId),
        updatedAt: serverTimestamp()
    });

    await updateDoc(propertyRef, {
        ownerContactId: contactId,
        updatedAt: serverTimestamp()
    });
}

export async function unlinkContactFromProperty(agentId: string, contactId: string, propertyId: string) {
    const firestore = useFirestore();
    if (!firestore) throw new Error("Firestore not initialized");
    const contactRef = doc(firestore, "agents", agentId, "contacts", contactId);
    const propertyRef = doc(firestore, "agents", agentId, "properties", propertyId);

    await updateDoc(contactRef, {
        linkedPropertyIds: arrayRemove(propertyId),
        updatedAt: serverTimestamp()
    });

    await updateDoc(propertyRef, {
        ownerContactId: null,
        updatedAt: serverTimestamp()
    });
}
