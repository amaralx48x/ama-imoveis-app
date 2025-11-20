
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  getDoc,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { useDemo } from '@/context/DemoContext';


/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  mutate: () => void; // Function to manually re-fetch data.
}

export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;
  const { isDemo, demoData, isLoading: isDemoLoading } = useDemo();

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const fetchData = useCallback(async () => {
    if (isDemo) return;
    if (!memoizedDocRef) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const docSnap = await getDoc(memoizedDocRef);
        if (docSnap.exists()) {
            setData({ ...(docSnap.data() as T), id: docSnap.id });
        } else {
            setData(null);
        }
        setError(null);
    } catch (e: any) {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });
        setError(contextualError);
        throw contextualError;
    } finally {
        setIsLoading(false);
    }
  }, [memoizedDocRef, isDemo]);
  
  useEffect(() => {
    if (isDemo) {
        if (!isDemoLoading && memoizedDocRef) {
             const collectionId = memoizedDocRef.parent.id;
             // Special case for 'agents' collection to get the single agent document
             if (collectionId === 'agents') {
                 setData(demoData.agent as StateDataType);
             } else {
                // For other collections, you might need a different logic
                // This is a simplified example
                // @ts-ignore
                const collectionData = demoData[collectionId as keyof typeof demoData];
                if(Array.isArray(collectionData)) {
                    const docData = collectionData.find(d => d.id === memoizedDocRef.id);
                    setData(docData || null);
                } else if (collectionData) { // If it's a single object (like 'content')
                    setData(collectionData)
                }
             }
        }
        setIsLoading(false);
        return;
    }
    
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });
        setError(contextualError);
        setData(null);
        setIsLoading(false);
        throw contextualError;
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, isDemo, isDemoLoading, demoData]);

  return { data, isLoading, error, mutate: fetchData };
}
