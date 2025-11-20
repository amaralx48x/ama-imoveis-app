
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Agent, Property, CustomSection, Review } from '@/lib/data';
import initialDemoData from '@/lib/demo-data.json';

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
  startDemo: () => void;
  endDemo: () => void;
  updateDemoData: <K extends keyof DemoState>(key: K, data: DemoState[K] | ((prev: DemoState[K]) => DemoState[K])) => void;
  isLoading: boolean;
}

const DemoContext = createContext<DemoContextProps | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startDemo = useCallback(() => {
    setIsLoading(true);
    // Deep clone to prevent mutations on the imported object
    const initialState = JSON.parse(JSON.stringify(initialDemoData));
    sessionStorage.setItem('isDemo', 'true');
    sessionStorage.setItem('demoState', JSON.stringify(initialState));
    setDemoState(initialState);
    setIsDemo(true);
    setIsLoading(false);
  }, []);

  const endDemo = useCallback(() => {
    sessionStorage.removeItem('isDemo');
    sessionStorage.removeItem('demoState');
    setIsDemo(false);
    setDemoState(null);
  }, []);
  
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

  const updateDemoData = useCallback(<K extends keyof DemoState>(key: K, data: DemoState[K] | ((prev: DemoState[K]) => DemoState[K])) => {
    setDemoState(prevState => {
      if (!prevState) return null;
      const newValue = typeof data === 'function' ? (data as (prev: DemoState[K]) => DemoState[K])(prevState[key]) : data;
      const newState = { ...prevState, [key]: newValue };
      sessionStorage.setItem('demoState', JSON.stringify(newState));
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
