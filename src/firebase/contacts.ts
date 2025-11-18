"use client";

import { addDoc, updateDoc, deleteDoc, collection, doc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { useFirestore } from "./index";
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

const contactsCollection = (agentId: string) => collection(useFirestore(), "agents", agentId, "contacts");

export async function createContact(agentId: string, data: any) {
    const firestore = useFirestore();
    if (!firestore) throw new Error("Firestore not initialized");

    const ref = collection(firestore, "agents", agentId, "contacts");
    
    try {
        const docRef = await addDoc(ref, {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            linkedPropertyIds: [],
        });
        return { id: docRef.id, ...data };
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'create',
            requestResourceData: data,
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