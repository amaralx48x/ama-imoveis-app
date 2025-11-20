'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import type { Agent, Property, Review, CustomSection, Lead, Contact } from '@/lib/data';
import demoSnapshot from '@/lib/demo-data.json';
import { useRouter } from 'next/navigation';

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
  startDemo: () => void;
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
  const router = useRouter();
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state with the static JSON dump
  const [demoData, setDemoDataState] = useState<DemoDataContext | null>(null);

  const startDemo = useCallback(() => {
    // Load static data into state and session storage
    const initialData = JSON.parse(JSON.stringify(demoSnapshot)) as DemoDataContext;
    setSessionStorage('demo_data', initialData);
    setDemoDataState(initialData);
    setIsDemo(true);
    setSessionStorage('isDemo', true);
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem('demo_data');
    sessionStorage.removeItem('isDemo');
    setIsDemo(false);
    setDemoDataState(null); // Reset to default
    router.push('/');
  }, [router]);
  
  useEffect(() => {
    const demoStatus = getSessionStorage('isDemo', false);
    setIsDemo(demoStatus);
    if (demoStatus) {
      const storedData = getSessionStorage('demo_data', null);
      setDemoDataState(storedData || demoSnapshot as DemoDataContext);
    }
    setIsLoading(false);
  }, []);

  const updateDemoData = useCallback((path: string, value: any) => {
    setDemoDataState(prevData => {
        if (!prevData) return prevData;
        
        const newData = structuredClone(prevData);
        const keys = path.split('/');
        let current: any = newData;

        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
            if (current === undefined) {
                console.error(`Invalid path for demo update: ${path}`);
                return prevData; // Don't update if path is invalid
            }
        }
        
        const lastKey = keys[keys.length - 1];

        // Handle array updates (add/delete/update)
        if (Array.isArray(current)) {
            const itemIndex = current.findIndex((item: any) => item.id === lastKey);
            if (itemIndex > -1) {
                if (value === null) { // Deletion
                    current.splice(itemIndex, 1);
                } else { // Update
                    current[itemIndex] = { ...current[itemIndex], ...value };
                }
            } else if (value !== null) { // Addition
                current.push(value);
            }
        } else {
             // Handle object updates
            current[lastKey] = value;
        }

        setSessionStorage('demo_data', newData);
        return newData;
    });
  }, []);

  const value = useMemo(() => ({
    isDemo,
    demoData: demoData,
    updateDemoData,
    isLoading,
    startDemo,
    exitDemo,
  }), [isDemo, demoData, isLoading, startDemo, exitDemo, updateDemoData]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextProps => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
