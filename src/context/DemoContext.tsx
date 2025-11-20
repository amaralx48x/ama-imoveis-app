
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProperties, getReviews, defaultPrivacyPolicy, defaultTermsOfUse } from '@/lib/data';
import type { Agent, Property, Review, CustomSection, Lead, Contact } from '@/lib/data';

// --- Tipos e Interfaces ---
interface DemoDataContext {
  agent: Agent | null;
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
}

// --- Dados Iniciais para o Modo Demo ---
const createInitialDemoData = (): DemoDataContext => {
  const demoAgent: Agent = {
    id: 'demo-user-arthur',
    displayName: 'Arthur',
    name: 'Arthur Imóveis',
    accountType: 'imobiliaria',
    email: 'arthur99.com@gmail.com',
    creci: '12345-J',
    description: 'Com mais de 10 anos de experiência no mercado imobiliário de luxo, nossa missão é conectar pessoas aos seus lares dos sonhos, oferecendo um serviço de excelência, transparência e dedicação total.',
    photoUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbGV8ZW58MHx8fHwxNzYyODU0MDUzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    phone: '(11) 91234-5678',
    cities: ['São Paulo', 'Campinas', 'Ubatuba'],
    role: 'admin', // Acesso de admin para a conta base, mas será bloqueado no modo demo
    plan: 'imobiliaria',
    availability: {
      days: { Segunda: true, Terça: true, Quarta: true, Quinta: true, Sexta: true, Sábado: true, Domingo: false },
      startTime: '08:00',
      endTime: '19:00',
    },
    siteSettings: {
      theme: 'dark',
      siteStatus: true,
      showFinancing: true,
      financingLink: 'https://www.google.com/search?q=simular+financiamento+imobiliario',
      showReviews: true,
      defaultSaleCommission: 6,
      defaultRentCommission: 100,
      faviconUrl: 'https://fav.farm/🚀',
      heroImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxyZWFsJTIwZXN0YXRlJTIwaG9tZXxlbnwwfHx8fDE3NjI4NTM2NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      socialLinks: [
        { id: '1', label: 'WhatsApp', url: '5511912345678', icon: 'whatsapp' },
        { id: '2', label: 'Instagram', url: 'arthur_imoveis', icon: 'instagram' },
        { id: '3', label: 'Facebook', url: 'https://facebook.com/arthurimoveis', icon: 'facebook' },
      ],
      privacyPolicy: defaultPrivacyPolicy.replace('[Nome do Site/Corretor]', 'Arthur Imóveis'),
      termsOfUse: defaultTermsOfUse.replace('[Nome do Site/Corretor]', 'Arthur Imóveis'),
    },
  };

  const demoProperties = getProperties().map(p => ({ ...p, agentId: 'demo-user-arthur' }));
  const demoReviews = getReviews();

  return {
    agent: demoAgent,
    properties: demoProperties,
    reviews: demoReviews,
    leads: [],
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
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';
  const [isLoading, setIsLoading] = useState(true);

  const [demoData, setDemoDataState] = useState<DemoDataContext>(() =>
    getSessionStorage('demo_data', createInitialDemoData())
  );

  useEffect(() => {
    if (isDemo) {
        const initialData = getSessionStorage('demo_data', null);
        if (!initialData) {
            const data = createInitialDemoData();
            setDemoDataState(data);
            setSessionStorage('demo_data', data);
        } else {
            setDemoDataState(initialData);
        }
    }
    setIsLoading(false);
  }, [isDemo]);
  
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
    isLoading
  }), [isDemo, demoData, isLoading]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextProps => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

    