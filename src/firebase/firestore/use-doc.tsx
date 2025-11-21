
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
import { useDemoSession } from '@/context/DemoSessionContext';


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

  const { isDemo, getData, setData } = useDemoSession();
  const [data, setLocalData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const storageKey = memoizedDocRef ? `firestore_cache_${memoizedDocRef.path}` : '';

  const fetchData = useCallback(async () => {
    if (!memoizedDocRef) {
        setIsLoading(false);
        return;
    }

    if (isDemo && storageKey) {
        const cachedData = getData<WithId<T>>(storageKey);
        if (cachedData) {
            setLocalData(cachedData);
            setIsLoading(false);
            return;
        }
    }

    setIsLoading(true);
    try {
        const docSnap = await getDoc(memoizedDocRef);
        if (docSnap.exists()) {
            const docData = { ...(docSnap.data() as T), id: docSnap.id };
            setLocalData(docData);
            if (isDemo && storageKey) {
                setData(storageKey, docData);
            }
        } else {
            setLocalData(null);
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
  }, [memoizedDocRef, isDemo, storageKey, getData, setData]);
  
  useEffect(() => {
    if (!memoizedDocRef) {
      setLocalData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    if (isDemo) {
        fetchData();
        return;
    }

    setIsLoading(true);
    setError(null);
    
    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setLocalData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setLocalData(null);
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
        setLocalData(null);
        setIsLoading(false);
        throw contextualError;
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef, isDemo, fetchData]);

  return { data, isLoading, error, mutate: fetchData };
}
