'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Agent, Property, Review, CustomSection, Lead, Contact } from '@/lib/data';
import demoSnapshot from '@/lib/demo-data.json';
import { getFirebaseServer } from '@/firebase/server-init';
import { getDoc, doc } from 'firebase/firestore';

// --- Tipos e Interfaces ---
export interface DemoDataContext {
  agent: Agent;
  properties: Property[];
  reviews: Review[];
  leads: Lead[];
  contacts: Contact[];
  customSections: CustomSection[];
}

interface DemoContextProps {
  isDemo: boolean;
  demoData: DemoDataContext | null;
  updateDemoData: (path: string, value: any) => void;
  isLoading: boolean;
  startDemo: () => Promise<void>;
  exitDemo: () => void;
}

const getSessionStorage = (key: string, initialValue: any) => {
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const item = window.sessionStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading sessionStorage key “${key}”:`, error);
    return initialValue;
  }
};

const setSessionStorage = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting sessionStorage key “${key}”:`, error);
    }
  }
};

// --- Contexto ---
const DemoContext = createContext<DemoContextProps | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [demoData, setDemoDataState] = useState<DemoDataContext | null>(() =>
    getSessionStorage('demo_data', null)
  );

  const startDemo = useCallback(async () => {
    // Carrega o dump estático como ponto de partida
    const initialData = JSON.parse(JSON.stringify(demoSnapshot)) as DemoDataContext;
    setSessionStorage('demo_data', initialData);
    setDemoDataState(initialData);
    setIsDemo(true);
    setSessionStorage('isDemo', true);
  }, []);

  const exitDemo = () => {
    sessionStorage.removeItem('demo_data');
    sessionStorage.removeItem('isDemo');
    setIsDemo(false);
    setDemoDataState(null);
    // O redirecionamento será tratado no componente que chama exitDemo
  };

  useEffect(() => {
    const demoStatus = getSessionStorage('isDemo', false);
    setIsDemo(demoStatus);
    if (demoStatus) {
      const storedData = getSessionStorage('demo_data', null);
      if (storedData) {
        setDemoDataState(storedData);
      } else {
        // Se o status for demo mas não houver dados, inicia a demo para carregar o snapshot.
        startDemo();
      }
    }
    setIsLoading(false);
  }, [startDemo]);
  
  const updateDemoData = (path: string, value: any) => {
    setDemoDataState(prevData => {
        if (!prevData) return null;
        
        // structuredClone para uma cópia profunda e segura
        const newData = structuredClone(prevData);
        const keys = path.split('/'); // ex: "agent/siteSettings"
        let current = newData as any;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if(Array.isArray(current) && !isNaN(Number(keys[i+1]))) {
              // Se o próximo segmento for um índice numérico, e o atual for um array
              const arrayKey = keys.slice(i, i+2).join('/'); // ex: properties/0
              const subPath = keys.slice(i+2).join('/');
              
              const itemIndex = current.findIndex((item: any) => item.id === keys[i+1] || i === Number(keys[i+1]));
              if(itemIndex > -1) {
                  let itemToUpdate = current[itemIndex];
                  const subKeys = subPath.split('/');
                  for (let j = 0; j < subKeys.length - 1; j++) {
                     itemToUpdate = itemToUpdate[subKeys[j]];
                  }
                  itemToUpdate[subKeys[subKeys.length - 1]] = value;
              }
              setSessionStorage('demo_data', newData);
              return newData;

            } else {
               current = current[key] = current[key] || {};
            }
        }
        current[keys[keys.length - 1]] = value;
        
        setSessionStorage('demo_data', newData);
        return newData;
    });
  };

  const value = useMemo(() => ({
    isDemo,
    demoData,
    updateDemoData,
    isLoading,
    startDemo,
    exitDemo,
  }), [isDemo, demoData, isLoading, startDemo]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextProps => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
