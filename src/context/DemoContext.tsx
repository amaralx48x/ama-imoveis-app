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

import { signInAnonymously } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';

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

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);
  const [demoState, setDemoState] = useState<DemoState | null>(null);

  const router = useRouter();

  const { auth } = useFirebase(); // SEMPRE pega auth aqui

  const clearSession = useCallback(() => {
    sessionStorage.removeItem('demoSessionId');
    sessionStorage.removeItem('demoOwnerUid');
    sessionStorage.removeItem('demoState');

    setSessionId(null);
    setOwnerUid(null);
    setDemoState(null);
    setIsDemo(false);
  }, []);

  // Recupera estado persistido da demo (sessionStorage)
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
      console.error('Failed to parse demo state:', error);
      clearSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [clearSession]);

  const startDemo = useCallback(async () => {
    if (!auth) {
      console.error('Auth was not ready when startDemo was called.');
      throw new Error('Auth is not initialized yet.');
    }

    setIsLoadingDemo(true);

    try {
      // 1. Login anônimo isolado
      const userCredential = await signInAnonymously(auth);
      const newOwnerUid = userCredential.user.uid;

      // 2. Buscar dados iniciais da demo
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) throw new Error('Failed to fetch demo data');

      const initialState: DemoState = await response.json();

      // 3. Criar sessão isolada
      const newSessionId = `demo_${Date.now()}`;

      // 4. Persistir sessão apenas no sessionStorage
      sessionStorage.setItem('demoSessionId', newSessionId);
      sessionStorage.setItem('demoOwnerUid', newOwnerUid);
      sessionStorage.setItem('demoState', JSON.stringify(initialState));

      // 5. Atualizar estados React
      setSessionId(newSessionId);
      setOwnerUid(newOwnerUid);
      setDemoState(initialState);
      setIsDemo(true);

      // 6. Redirecionar para o painel demo
      router.push('/dashboard');

    } catch (error) {
      console.error('Error starting demo:', error);
      clearSession();
    } finally {
      setIsLoadingDemo(false);
    }
  }, [auth, router, clearSession]);

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

      const newState = structuredClone(prevState);
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

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        isLoadingDemo,
        demoState,
        sessionId,
        ownerUid,
        startDemo,
        endDemo,
        resetDemo,
        updateDemoState,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};
