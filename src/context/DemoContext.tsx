'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Agent, Property, CustomSection, Review, SiteSettings } from '@/lib/data';

// Estrutura completa dos dados da conta demo
export interface DemoState {
  agent: Agent;
  properties: Property[];
  customSections: CustomSection[];
  reviews: Review[];
}

interface DemoContextProps {
  isDemo: boolean;
  demoState: DemoState | null;
  startDemo: () => Promise<void>;
  endDemo: () => void;
  updateDemoData: <K extends keyof DemoState>(key: K, data: DemoState[K]) => void;
  isLoading: boolean;
}

const DemoContext = createContext<DemoContextProps | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startDemo = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/demo-snapshot');
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados de demonstração.');
      }
      const initialState: DemoState = await response.json();
      
      // Armazena no sessionStorage para persistir entre reloads
      sessionStorage.setItem('isDemo', 'true');
      sessionStorage.setItem('demoState', JSON.stringify(initialState));

      setDemoState(initialState);
      setIsDemo(true);
    } catch (error) {
      console.error("Erro ao iniciar a demo:", error);
      setIsDemo(false);
      setDemoState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const endDemo = useCallback(() => {
    sessionStorage.removeItem('isDemo');
    sessionStorage.removeItem('demoState');
    setIsDemo(false);
    setDemoState(null);
  }, []);
  
  // Tenta carregar do sessionStorage na inicialização
  React.useEffect(() => {
    const sessionIsDemo = sessionStorage.getItem('isDemo') === 'true';
    if (sessionIsDemo) {
      const sessionState = sessionStorage.getItem('demoState');
      if (sessionState) {
        setDemoState(JSON.parse(sessionState));
        setIsDemo(true);
      }
    }
  }, []);


  const updateDemoData = useCallback(<K extends keyof DemoState>(key: K, data: DemoState[K]) => {
    setDemoState(prevState => {
      if (!prevState) return null;
      const newState = { ...prevState, [key]: data };
      sessionStorage.setItem('demoState', JSON.stringify(newState)); // Atualiza sessionStorage
      return newState;
    });
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, demoState, startDemo, endDemo, updateDemoData, isLoading }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo deve ser usado dentro de um DemoProvider');
  }
  return context;
}
