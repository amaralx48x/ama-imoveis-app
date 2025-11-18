
'use client';
import { collection, addDoc, doc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase"; // seu export já existente
import { doc as docRef, updateDoc as updateDocRef, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

const contactsCollection = (agentId: string) => collection(firestore, "agents", agentId, "contacts");

// listar (realtime hook preferível, mas manter util)
export async function listContactsOnce(agentId: string) {
  const q = query(contactsCollection(agentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createContact(agentId: string, payload: Partial<any>) {
  const ref = await addDoc(contactsCollection(agentId), {
    ...payload,
    linkedPropertyIds: payload.linkedPropertyIds || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  // retorna id + dados
  return { id: ref.id, ...payload };
}

export async function updateContact(agentId: string, contactId: string, payload: Partial<any>) {
  const ref = doc(firestore, "agents", agentId, "contacts", contactId);
  await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
}

export async function deleteContact(agentId: string, contactId: string) {
  const ref = doc(firestore, "agents", agentId, "contacts", contactId);
  await deleteDoc(ref);
}

// Vincular/Desvincular propriedade (modifica contact.linkedPropertyIds e property.ownerId)

export async function linkContactToProperty(agentId: string, contactId: string, propertyId: string) {
  const contactRef = docRef(firestore, "agents", agentId, "contacts", contactId);
  const propertyRef = docRef(firestore, "agents", agentId, "properties", propertyId);

  // Atualiza contact
  await updateDocRef(contactRef, {
    linkedPropertyIds: arrayUnion(propertyId),
    updatedAt: serverTimestamp()
  });

  // Atualiza property com owner link (só interno; não exibe publicamente)
  await updateDocRef(propertyRef, {
    ownerContactId: contactId,
    updatedAt: serverTimestamp()
  });
}

export async function unlinkContactFromProperty(agentId: string, contactId: string, propertyId: string) {
  const contactRef = docRef(firestore, "agents", agentId, "contacts", contactId);
  const propertyRef = docRef(firestore, "agents", agentId, "properties", propertyId);

  await updateDocRef(contactRef, {
    linkedPropertyIds: arrayRemove(propertyId),
    updatedAt: serverTimestamp()
  });

  await updateDocRef(propertyRef, {
    ownerContactId: null,
    updatedAt: serverTimestamp()
  });
}

