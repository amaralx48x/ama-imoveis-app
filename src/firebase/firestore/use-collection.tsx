
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
import type { DemoDataContext } from '@/context/DemoContext';


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

function getDemoCollectionData(demoData: DemoDataContext, targetRefOrQuery: any): any[] {
    if (!demoData) return [];
    
    let path;
    // Check if it's a collection group query (no simple path)
    if (targetRefOrQuery._query && targetRefOrQuery._query.collectionGroup) {
        const collectionKey = targetRefOrQuery._query.collectionGroup;
         if (collectionKey === 'properties') {
            return demoData.properties || [];
        }
        // Handle other collection groups if necessary
        return [];
    }
    
    path = targetRefOrQuery.path || (targetRefOrQuery._query && targetRefOrQuery._query.path.canonicalString());
    if (!path) return [];
    
    const pathSegments = path.split('/');
    // For sub-collections like 'reviews', the key is the collection name itself.
    const collectionKey = pathSegments[pathSegments.length - 1] as keyof DemoDataContext;

    // @ts-ignore
    return demoData[collectionKey] || [];
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;
  const { isDemo, demoData, isLoading: isDemoLoading } = useDemo();

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!memoizedTargetRefOrQuery) return;
    setIsLoading(true);
    try {
        if (isDemo && demoData) {
            const collectionData = getDemoCollectionData(demoData, memoizedTargetRefOrQuery);
            setData(collectionData);
        } else if (!isDemo) {
            const snapshot = await getDocs(memoizedTargetRefOrQuery);
            const results: ResultItemType[] = [];
            for (const doc of snapshot.docs) {
              results.push({ ...(doc.data() as T), id: doc.id });
            }
            setData(results);
        }
        setError(null);
    } catch (e: any) {
        if (!isDemo) {
            const path: string = memoizedTargetRefOrQuery.type === 'collection' ? (memoizedTargetRefOrQuery as CollectionReference).path : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()
            const contextualError = new FirestorePermissionError({ operation: 'list', path });
            setError(contextualError);
            throw contextualError;
        } else {
            setError(new Error("Error fetching demo data."));
        }
    } finally {
        setIsLoading(false);
    }
  }, [memoizedTargetRefOrQuery, isDemo, demoData]);

  useEffect(() => {
    if (isDemo) {
        if (!isDemoLoading && demoData && memoizedTargetRefOrQuery) {
            const collectionData = getDemoCollectionData(demoData, memoizedTargetRefOrQuery);
            setData(collectionData as StateDataType);
        }
        setIsLoading(isDemoLoading);
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
  }, [memoizedTargetRefOrQuery, isDemo, isDemoLoading, demoData]);

  if (memoizedTargetRefOrQuery && !isDemo && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error, mutate: fetchData };
}
