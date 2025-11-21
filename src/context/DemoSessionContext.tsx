
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const DEMO_SESSION_KEY = 'demo_session_active';

interface DemoSessionContextProps {
  isDemo: boolean;
  startDemo: () => void;
  endDemo: () => void;
  isDemoLoading: boolean;
  getData: <T>(key: string) => T | null;
  setData: <T>(key: string, data: T) => void;
}

const DemoSessionContext = createContext<DemoSessionContextProps | undefined>(undefined);

export const DemoSessionProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check session storage on initial load
    const sessionActive = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
    setIsDemo(sessionActive);
  }, []);

  const startDemo = useCallback(async () => {
    if (!auth) {
      console.error("Auth service not available.");
      return;
    }
    setIsDemoLoading(true);
    try {
      // Hardcoded credentials for the demo account
      await signInWithEmailAndPassword(auth, 'arthur99.com@gmail.com', '91664957');
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      setIsDemo(true);
      router.push('/dashboard');
    } catch (error) {
      console.error("Demo login failed:", error);
    } finally {
      setIsDemoLoading(false);
    }
  }, [auth, router]);

  const endDemo = useCallback(async () => {
    if (!auth) return;
    await auth.signOut();
    sessionStorage.clear();
    setIsDemo(false);
    router.push('/login');
  }, [auth, router]);

  const getData = <T>(key: string): T | null => {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  };

  const setData = <T>(key: string, data: T) => {
    sessionStorage.setItem(key, JSON.stringify(data));
  };


  const value = {
    isDemo,
    startDemo,
    endDemo,
    isDemoLoading,
    getData,
    setData,
  };

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  );
};

export const useDemoSession = () => {
  const context = useContext(DemoSessionContext);
  if (context === undefined) {
    throw new Error('useDemoSession must be used within a DemoSessionProvider');
  }
  return context;
};
