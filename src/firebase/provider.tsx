
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useRouter } from 'next/navigation';

export interface DemoState {
  agent: any;
  properties: any[];
  reviews: any[];
  customSections: any[];
  leads: any[];
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  
  // Demo properties
  isDemo: boolean;
  isLoadingDemo: boolean;
  demoState: DemoState | null;
  startDemo: () => Promise<void>;
  endDemo: () => void;
}

export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

interface FirebaseProviderProps {
    children: ReactNode;
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: auth?.currentUser,
    isUserLoading: true, 
    userError: null,
  });

  const [isDemo, setIsDemo] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(true);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const router = useRouter();

  const clearDemoSession = useCallback(() => {
    sessionStorage.removeItem('isDemo');
    sessionStorage.removeItem('demoState');
    setIsDemo(false);
    setDemoState(null);
  }, []);

  useEffect(() => {
    try {
      const storedIsDemo = sessionStorage.getItem('isDemo');
      const storedState = sessionStorage.getItem('demoState');
      if (storedIsDemo === 'true' && storedState) {
        setDemoState(JSON.parse(storedState));
        setIsDemo(true);
      }
    } catch (error) {
      console.error('Failed to parse demo state from sessionStorage:', error);
      clearDemoSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [clearDemoSession]);

  useEffect(() => {
    if (isDemo || !auth) { 
      setUserAuthState({ user: null, isUserLoading: false, userError: null });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, isDemo]);
  
  const startDemo = useCallback(async () => {
    if (!auth) {
      console.error('Auth was not ready when startDemo was called.');
      throw new Error('Auth is not initialized yet.');
    }
    setIsLoadingDemo(true);
    try {
      await signInAnonymously(auth);
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) throw new Error('Failed to fetch demo data');
      const initialState: DemoState = await response.json();
      
      sessionStorage.setItem('isDemo', 'true');
      sessionStorage.setItem('demoState', JSON.stringify(initialState));

      setDemoState(initialState);
      setIsDemo(true);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error starting demo:', error);
      clearDemoSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [auth, router, clearDemoSession]);

  const endDemo = useCallback(() => {
    clearDemoSession();
    auth.signOut();
    router.push('/');
  }, [clearDemoSession, auth, router]);

  const demoUser = useMemo(() => {
    if (!isDemo || !demoState) return null;
    return {
        uid: 'demo-user',
        isAnonymous: true,
        displayName: "Visitante da Demo",
        email: "demo@example.com",
    } as User;
  }, [isDemo, demoState]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: isDemo ? demoUser : userAuthState.user,
      isUserLoading: isDemo ? isLoadingDemo : userAuthState.isUserLoading,
      userError: userAuthState.userError,
      // Demo state and functions
      isDemo,
      isLoadingDemo,
      demoState,
      startDemo,
      endDemo,
    };
  }, [firebaseApp, firestore, auth, userAuthState, isDemo, isLoadingDemo, demoState, startDemo, endDemo, demoUser]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {!isDemo && <FirebaseErrorListener />}
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useAuth = (): Auth | null => useFirebase().auth;
export const useFirestore = (): Firestore | null => useFirebase().firestore;
export const useFirebaseApp = (): FirebaseApp | null => useFirebase().firebaseApp;

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
