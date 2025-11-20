
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
import { useDemo } from '@/context/DemoContext';


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
  const { isDemo, demoState } = useDemo();
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (isDemo) {
        setIsLoading(true);
        if (memoizedTargetRefOrQuery && demoState) {
             const path = (memoizedTargetRefOrQuery as CollectionReference).path;
             const pathSegments = path.split('/');

             if(pathSegments.includes('properties')) {
                 setData(demoState.properties as WithId<T>[]);
             } else if(pathSegments.includes('customSections')) {
                 setData(demoState.customSections as WithId<T>[]);
             } else if(pathSegments.includes('reviews')) {
                 setData(demoState.reviews as WithId<T>[]);
             }
             else {
                 setData([]);
             }
        } else {
            setData(null);
        }
        setIsLoading(false);
        return;
    }
  }, [isDemo, demoState, memoizedTargetRefOrQuery]);

  const fetchData = useCallback(async () => {
    if (isDemo || !memoizedTargetRefOrQuery) return;
    setIsLoading(true);
    try {
        const snapshot = await getDocs(memoizedTargetRefOrQuery);
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
    } catch (e: any) {
        const path: string = memoizedTargetRefOrQuery.type === 'collection' ? (memoizedTargetRefOrQuery as CollectionReference).path : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()
        const contextualError = new FirestorePermissionError({ operation: 'list', path });
        setError(contextualError);
        throw contextualError;
    } finally {
        setIsLoading(false);
    }
  }, [memoizedTargetRefOrQuery, isDemo]);

  useEffect(() => {
    if (isDemo) {
        setIsLoading(false);
        return;
    }
    
    if (!memoizedTargetRefOrQuery) {
      setData(null);
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
        setData(results);
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
        setData(null);
        setIsLoading(false);
        throw contextualError;
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, isDemo]);

  return { data, isLoading, error, mutate: fetchData };
}
