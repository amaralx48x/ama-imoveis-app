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
import { signInAnonymously, Auth } from 'firebase/auth'; // Import Auth type

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
  sessionId: string | null;
  ownerUid: string | null;
  startDemo: (auth: Auth) => Promise<void>; // Modified to accept auth instance
  endDemo: () => void;
  resetDemo: () => void;
  updateDemoState: (path: string, data: any) => void;
}

const DemoContext = createContext<DemoContextProps | undefined>(undefined);

// Hook para usar o contexto da demo
export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

// Componente Provedor do Contexto
export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const router = useRouter();

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('demoSessionId');
    sessionStorage.removeItem('demoOwnerUid');
    sessionStorage.removeItem('demoState');
    setSessionId(null);
    setOwnerUid(null);
    setDemoState(null);
    setIsDemo(false);
  }, []);

  // On initial load, check sessionStorage for an active demo session
  useEffect(() => {
    try {
      const storedSessionId = sessionStorage.getItem('demoSessionId');
      const storedOwnerUid = sessionStorage.getItem('demoOwnerUid');
      const storedState = sessionStorage.getItem('demoState');

      if (storedSessionId && storedOwnerUid && storedState) {
        setSessionId(storedSessionId);
        setOwnerUid(storedOwnerUid);
        setDemoState(JSON.parse(storedState));
        setIsDemo(true);
      }
    } catch (error) {
      console.error('Failed to parse demo state from sessionStorage:', error);
      clearSession(); // Clear corrupted session
    } finally {
      setIsLoadingDemo(false);
    }
  }, [clearSession]);

  const startDemo = useCallback(async (auth: Auth) => { // Accept auth instance as a parameter
    if (!auth) {
        console.error("Auth service is not available to start demo.");
        return;
    }
    setIsLoadingDemo(true);
    try {
      // 1. Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      const newOwnerUid = userCredential.user.uid;

      // 2. Fetch the initial data snapshot
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) {
        throw new Error('Failed to fetch demo data');
      }
      const initialState: DemoState = await response.json();
      
      // 3. Create a unique session ID
      const newSessionId = `demo_${Date.now()}`;

      // 4. Store everything in session storage
      sessionStorage.setItem('demoSessionId', newSessionId);
      sessionStorage.setItem('demoOwnerUid', newOwnerUid);
      sessionStorage.setItem('demoState', JSON.stringify(initialState));

      // 5. Update React state
      setSessionId(newSessionId);
      setOwnerUid(newOwnerUid);
      setDemoState(initialState);
      setIsDemo(true);
      
      // 6. Redirect to the dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error starting demo session:', error);
      clearSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [router, clearSession]);
  
  const endDemo = useCallback(() => {
    clearSession();
    router.push('/');
  }, [clearSession, router]);

  const resetDemo = useCallback(() => {
    // This part is tricky without auth. For now, it will just clear and wait for a manual restart.
    clearSession();
    // A full reset would need access to auth again, which complicates things.
    // A simpler UX might be to just end the demo and let the user restart from the landing page.
    router.push('/'); 
  }, [clearSession, router]);

  const updateDemoState = (path: string, data: any) => {
    setDemoState(prevState => {
      if (!prevState) return null;
      const newState = JSON.parse(JSON.stringify(prevState)); // Deep copy
      const keys = path.split('.');
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
        if (current === undefined) return prevState; // Path does not exist
      }
      current[keys[keys.length - 1]] = data;

      sessionStorage.setItem('demoState', JSON.stringify(newState));
      return newState;
    });
  };

  const value = {
    isDemo,
    isLoadingDemo,
    demoState,
    sessionId,
    ownerUid,
    startDemo,
    endDemo,
    resetDemo,
    updateDemoState,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};
