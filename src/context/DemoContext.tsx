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

// Define a interface para o estado da demo
export interface DemoState {
  // Adicione aqui os tipos de dados que serão mockados
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
  startDemo: () => Promise<void>;
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
  }, []);

  const startDemo = useCallback(async () => {
    setIsLoadingDemo(true);
    try {
      // NOTE: Cloud Function 'createDemoSession' needs to be implemented separately.
      // This function would handle anonymous sign-in and create the session doc.
      // For now, we simulate the API call to get the initial data structure.
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) {
        throw new Error('Failed to fetch demo data');
      }
      const initialState: DemoState = await response.json();
      
      // These would normally come from the Cloud Function response
      const newSessionId = `demo_${Date.now()}`;
      const newOwnerUid = `anonymous_user_${Date.now()}`; // Simulated anonymous UID

      // Store in session storage
      sessionStorage.setItem('demoSessionId', newSessionId);
      sessionStorage.setItem('demoOwnerUid', newOwnerUid);
      sessionStorage.setItem('demoState', JSON.stringify(initialState));

      // Update React state
      setSessionId(newSessionId);
      setOwnerUid(newOwnerUid);
      setDemoState(initialState);
      setIsDemo(true);
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error starting demo session:', error);
    } finally {
      setIsLoadingDemo(false);
    }
  }, [router]);

  const clearSession = () => {
    sessionStorage.removeItem('demoSessionId');
    sessionStorage.removeItem('demoOwnerUid');
    sessionStorage.removeItem('demoState');
    setSessionId(null);
    setOwnerUid(null);
    setDemoState(null);
    setIsDemo(false);
  };
  
  const endDemo = () => {
    clearSession();
    // Here you might call a Cloud Function to clean up Firestore/Storage resources
    router.push('/');
  };

  const resetDemo = () => {
    // Re-calls startDemo to fetch a fresh state
    clearSession();
    startDemo();
  };

  const updateDemoState = (path: string, data: any) => {
    // A simple implementation to update nested state.
    // e.g., updateDemoState('agent.siteSettings.theme', 'light')
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

      // Persist updated state to sessionStorage
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
