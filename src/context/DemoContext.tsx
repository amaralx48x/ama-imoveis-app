'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import type { Auth } from 'firebase/auth';

// Define a interface para o estado da demo
export interface DemoState {
  agent: any;
  properties: any[];
  reviews: any[];
  customSections: any[];
  leads: any[];
}

interface DemoContextProps {
  isDemo: boolean;
  isLoadingDemo: boolean;
  demoState: DemoState | null;
  startDemo: () => Promise<void>;
  endDemo: (auth: Auth | null) => void;
}

const DemoContext = createContext<DemoContextProps | undefined>(undefined);

// Hook para acessar o contexto
export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
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

  // Recupera estado persistido da demo (sessionStorage)
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

  const startDemo = useCallback(async () => {
    setIsLoadingDemo(true);
    try {
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) {
        throw new Error('Failed to fetch demo data');
      }

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
  }, [router, clearDemoSession]);


  const endDemo = useCallback((auth: Auth | null) => {
    clearDemoSession();
    if(auth) {
        auth.signOut();
    }
    router.push('/');
  }, [clearDemoSession, router]);


  return (
    <DemoContext.Provider
      value={{
        isDemo,
        isLoadingDemo,
        demoState,
        startDemo,
        endDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};
