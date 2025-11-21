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
import { signInAnonymously, Auth } from 'firebase/auth';
import { FirebaseProvider } from '@/firebase/provider';
import { FirebaseServices, FirebaseServicesContext } from '@/firebase/client-provider';

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

  // Agora, pegamos os serviços do Firebase do novo contexto
  const firebaseServices = useContext(FirebaseServicesContext);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('demoSessionId');
    sessionStorage.removeItem('demoOwnerUid');
    sessionStorage.removeItem('demoState');
    setSessionId(null);
    setOwnerUid(null);
    setDemoState(null);
    setIsDemo(false);
  }, []);

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
      clearSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [clearSession]);

  const startDemo = useCallback(async () => {
    if (!firebaseServices?.auth) {
        console.error("Auth service is not available to start demo.");
        return;
    }
    setIsLoadingDemo(true);
    try {
      const userCredential = await signInAnonymously(firebaseServices.auth);
      const newOwnerUid = userCredential.user.uid;
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) {
        throw new Error('Failed to fetch demo data');
      }
      const initialState: DemoState = await response.json();
      const newSessionId = `demo_${Date.now()}`;
      sessionStorage.setItem('demoSessionId', newSessionId);
      sessionStorage.setItem('demoOwnerUid', newOwnerUid);
      sessionStorage.setItem('demoState', JSON.stringify(initialState));
      setSessionId(newSessionId);
      setOwnerUid(newOwnerUid);
      setDemoState(initialState);
      setIsDemo(true);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error starting demo session:', error);
      clearSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [router, clearSession, firebaseServices]);
  
  const endDemo = useCallback(() => {
    clearSession();
    router.push('/');
  }, [clearSession, router]);

  const resetDemo = useCallback(() => {
    clearSession();
    router.push('/'); 
  }, [clearSession, router]);

  const updateDemoState = (path: string, data: any) => {
    setDemoState(prevState => {
      if (!prevState) return null;
      const newState = JSON.parse(JSON.stringify(prevState));
      const keys = path.split('.');
      let current: any = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
        if (current === undefined) return prevState;
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
  
  if (!firebaseServices) {
      return <div>Carregando serviços do Firebase...</div>;
  }

  // O DemoProvider agora RENDERIZA o FirebaseProvider, garantindo a ordem
  return (
    <DemoContext.Provider value={value}>
        <FirebaseProvider 
            firebaseApp={firebaseServices.firebaseApp} 
            auth={firebaseServices.auth} 
            firestore={firebaseServices.firestore}
        >
            {children}
        </FirebaseProvider>
    </DemoContext.Provider>
  );
};
