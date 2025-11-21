
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  getDocs,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  mutate: () => void;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}


export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setLocalData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!memoizedTargetRefOrQuery) return;

    setIsLoading(true);
    try {
        const snapshot = await getDocs(memoizedTargetRefOrQuery);
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setLocalData(results);
        setError(null);
    } catch (e: any) {
        const path: string = memoizedTargetRefOrQuery.type === 'collection' ? (memoizedTargetRefOrQuery as CollectionReference).path : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()
        const contextualError = new FirestorePermissionError({ operation: 'list', path });
        setError(contextualError);
        throw contextualError;
    } finally {
        setIsLoading(false);
    }
  }, [memoizedTargetRefOrQuery]);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setLocalData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setLocalData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        let path: string;
        if ((memoizedTargetRefOrQuery as any)._query?.collectionGroup) {
            path = `collectionGroup:${(memoizedTargetRefOrQuery as any)._query.collectionGroup}`;
        } else {
            path = memoizedTargetRefOrQuery.type === 'collection' 
                ? (memoizedTargetRefOrQuery as CollectionReference).path 
                : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();
        }
        const contextualError = new FirestorePermissionError({ operation: 'list', path });
        setError(contextualError);
        setLocalData(null);
        setIsLoading(false);
        throw contextualError;
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error, mutate: fetchData };
}
