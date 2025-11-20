'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getProperties, getReviews, defaultPrivacyPolicy, defaultTermsOfUse, getAgent } from '@/lib/data';
import type { Agent, Property, Review, CustomSection, Lead, Contact } from '@/lib/data';

// --- Tipos e Interfaces ---
interface DemoDataContext {
  agent: Agent;
  properties: Property[];
  reviews: Review[];
  leads: Lead[];
  contacts: Contact[];
  customSections: CustomSection[];
}

interface DemoContextProps {
  isDemo: boolean;
  demoData: DemoDataContext;
  updateDemoData: (key: keyof DemoDataContext, data: any) => void;
  isLoading: boolean;
  startDemo: () => void;
}


// --- Dados Iniciais para o Modo Demo ---
const createInitialDemoData = (): DemoDataContext => {
  const demoAgent: Agent = getAgent();
  const demoProperties = getProperties();
  const demoReviews = getReviews();
  const demoLeads: Lead[] = [
      { id: 'lead1', name: 'Mariana Silva', email: 'mariana.silva@example.com', message: 'Gostaria de agendar uma visita para o Apartamento Luxuoso no Centro. Tenho urgência!', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), status: 'unread', leadType: 'buyer' },
      { id: 'lead2', name: 'Pedro Albuquerque', email: 'pedro.a@example.com', message: 'Tenho interesse em anunciar meu imóvel com vocês. É uma casa em Campinas.', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), status: 'unread', leadType: 'seller' },
      { id: 'lead3', name: 'Beatriz Santos', email: 'beatriz.santos@example.com', message: 'Olá, qual o valor do condomínio da Casa de Praia com Vista para o Mar?', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'read', leadType: 'buyer' },
  ];

  return {
    agent: demoAgent,
    properties: demoProperties,
    reviews: demoReviews,
    leads: demoLeads,
    contacts: [],
    customSections: [
      { id: 'lancamentos', title: 'Lançamentos', order: 1, createdAt: new Date().toISOString() },
      { id: 'alto-padrao', title: 'Alto Padrão', order: 2, createdAt: new Date().toISOString() }
    ],
  };
};

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

  const [demoData, setDemoDataState] = useState<DemoDataContext>(() =>
    getSessionStorage('demo_data', createInitialDemoData())
  );

  const startDemo = () => {
    const initialData = createInitialDemoData();
    setSessionStorage('demo_data', initialData);
    setDemoDataState(initialData);
    setIsDemo(true);
    setSessionStorage('isDemo', true);
  };

  useEffect(() => {
    // Check session storage on initial client load
    const demoStatus = getSessionStorage('isDemo', false);
    setIsDemo(demoStatus);
    if (demoStatus) {
      const storedData = getSessionStorage('demo_data', null);
      if (storedData) {
        setDemoDataState(storedData);
      }
    }
    setIsLoading(false);
  }, []);
  
  const updateDemoData = (key: keyof DemoDataContext, data: any) => {
    setDemoDataState(prevData => {
        const newData = { ...prevData, [key]: data };
        setSessionStorage('demo_data', newData);
        return newData;
    });
  };

  const value = useMemo(() => ({
    isDemo,
    demoData,
    updateDemoData,
    isLoading,
    startDemo
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
