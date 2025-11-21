
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

const DEMO_SESSION_KEY = 'demo_session_active';

interface DemoAccountSettings {
  email?: string;
  password?: string;
}

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
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    const sessionActive = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';
    setIsDemo(sessionActive);
  }, []);

  const startDemo = useCallback(async () => {
    if (!auth || !firestore) {
      console.error("Auth or Firestore service not available.");
      return;
    }
    setIsDemoLoading(true);
    try {
      const settingsRef = doc(firestore, 'systemSettings', 'demoAccount');
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        throw new Error("As configurações da conta de demonstração não foram encontradas.");
      }

      const { email, password } = settingsSnap.data() as DemoAccountSettings;

      if (!email || !password) {
        throw new Error("As credenciais da conta de demonstração não estão configuradas no painel de administração.");
      }
      
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      setIsDemo(true);
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Demo login failed:", error);
      alert(`Falha no login da demonstração: ${error.message}`);
    } finally {
      setIsDemoLoading(false);
    }
  }, [auth, firestore, router]);

  const endDemo = useCallback(async () => {
    if (!auth) return;
    await auth.signOut();
    sessionStorage.clear();
    setIsDemo(false);
    router.push('/login');
  }, [auth, router]);

  const getData = <T>(key: string): T | null => {
    if (!isDemo) return null;
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  };

  const setData = <T>(key: string, data: T) => {
    if (!isDemo) return;
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
