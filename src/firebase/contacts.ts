
'use client';

import {
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Firestore,
} from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

// As funções agora recebem a instância do Firestore como parâmetro (Dependency Injection)

export async function createContact(
  firestore: Firestore,
  agentId: string,
  payload: any
) {
  const collRef = collection(firestore, 'agents', agentId, 'contacts');

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

export async function updateContact(
  firestore: Firestore,
  agentId: string,
  contactId: string,
  data: any
) {
  const ref = doc(firestore, 'agents', agentId, 'contacts', contactId);
  return await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteContact(
  firestore: Firestore,
  agentId: string,
  contactId: string
) {
  const ref = doc(firestore, 'agents', agentId, 'contacts', contactId);
  return await deleteDoc(ref);
}

export async function linkContactToProperty(
  firestore: Firestore,
  agentId: string,
  contactId: string,
  propertyId: string
) {
  const contactRef = doc(firestore, 'agents', agentId, 'contacts', contactId);
  const propertyRef = doc(
    firestore,
    'agents',
    agentId,
    'properties',
    propertyId
  );

  await updateDoc(contactRef, {
    linkedPropertyIds: arrayUnion(propertyId),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(propertyRef, {
    ownerContactId: contactId,
    updatedAt: serverTimestamp(),
  });
}

export async function unlinkContactFromProperty(
  firestore: Firestore,
  agentId: string,
  contactId: string,
  propertyId: string
) {
  const contactRef = doc(firestore, 'agents', agentId, 'contacts', contactId);
  const propertyRef = doc(
    firestore,
    'agents',
    agentId,
    'properties',
    propertyId
  );

  await updateDoc(contactRef, {
    linkedPropertyIds: arrayRemove(propertyId),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(propertyRef, {
    ownerContactId: null,
    updatedAt: serverTimestamp(),
  });
}
