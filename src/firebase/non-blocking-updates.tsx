
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * DOES NOT handle errors, expects a try/catch block in the caller.
 */
export async function setDocument(docRef: DocumentReference, data: any, options: SetOptions) {
  await setDoc(docRef, data, options);
}

/**
 * Initiates an updateDoc operation for a document reference.
 * DOES NOT handle errors, expects a try/catch block in the caller.
 */
export async function updateDocument(docRef: DocumentReference, data: any) {
  await updateDoc(docRef, data);
}

/**
 * Initiates an addDoc operation for a collection reference.
 * DOES NOT handle errors, expects a try/catch block in the caller.
 */
export async function addDocument(colRef: CollectionReference, data: any) {
  return await addDoc(colRef, data);
}

/**
 * Initiates a deleteDoc operation for a document reference.
 * DOES NOT handle errors, expects a try/catch block in the caller.
 */
export async function deleteDocument(docRef: DocumentReference) {
  await deleteDoc(docRef);
}
