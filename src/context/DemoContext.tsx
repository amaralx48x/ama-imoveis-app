'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProperties, getReviews, getPropertyCities, getPropertyTypes, defaultPrivacyPolicy, defaultTermsOfUse } from '@/lib/data';
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
    id: 'demo-user',
    displayName: 'Usuário de Teste',
    name: 'Imóveis Demo',
    accountType: 'imobiliaria',
    email: 'demo@cliente.com',
    creci: '123456-F',
    description: 'Sou um corretor apaixonado por encontrar o lar perfeito para meus clientes. Com anos de experiência no mercado, ofereço um serviço personalizado e focado nas suas necessidades.',
    photoUrl: 'https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjE5NTYzOTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    phone: '(11) 98765-4321',
    cities: ['São Paulo', 'Campinas'],
    role: 'corretor',
    plan: 'imobiliaria',
    availability: {
      days: { Segunda: true, Terça: true, Quarta: true, Quinta: true, Sexta: true, Sábado: false, Domingo: false },
      startTime: '09:00',
      endTime: '18:00',
    },
    siteSettings: {
      theme: 'dark',
      siteStatus: true,
      showFinancing: true,
      financingLink: 'https://www.google.com/search?q=simular+financiamento+imobiliario',
      showReviews: true,
      defaultSaleCommission: 6,
      defaultRentCommission: 100,
      faviconUrl: 'https://fav.farm/✅',
      heroImageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxyZWFsJTIwZXN0YXRlfGVufDB8fHx8MTc2MjI0NzU0OHww&ixlib=rb-4.1.0&q=80&w=1080',
      socialLinks: [
        { id: '1', label: 'WhatsApp', url: '5511987654321', icon: 'whatsapp' },
        { id: '2', label: 'Instagram', url: 'seu_usuario', icon: 'instagram' },
      ],
      privacyPolicy: defaultPrivacyPolicy.replace('[Nome do Site/Corretor]', 'Imóveis Demo'),
      termsOfUse: defaultTermsOfUse.replace('[Nome do Site/Corretor]', 'Imóveis Demo'),
    },
  };

  const demoProperties = getProperties().map(p => ({ ...p, agentId: 'demo-user' }));
  const demoReviews = getReviews();

  return {
    agent: demoAgent,
    properties: demoProperties,
    reviews: demoReviews,
    leads: [],
    contacts: [],
    customSections: [
      { id: 'lancamentos', title: 'Lançamentos', order: 1, createdAt: new Date().toISOString() }
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
