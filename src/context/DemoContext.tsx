
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { getProperties, getReviews, defaultPrivacyPolicy, defaultTermsOfUse, getAgent } from '@/lib/data';
import type { Agent, Property, Review, CustomSection, Lead, Contact } from '@/lib/data';
import { getFirebaseServer } from '@/firebase/server-init';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { initializeFirebase } from '@/firebase';


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
  startDemo: () => Promise<void>;
}

const DEMO_AGENT_ID = '4vEISo4pEORjFhv6RzD7eC42cgm2';

// --- Dados Iniciais para o Modo Demo ---
const createInitialDemoData = (): DemoDataContext => {
    const demoAgent: Agent = getAgent();
    demoAgent.id = 'demo-user-arthur';

  const demoProperties = getProperties().map(p => ({ ...p, agentId: 'demo-user-arthur' }));
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

const fetchDemoAccountSnapshot = async (): Promise<DemoDataContext> => {
    const { firestore } = initializeFirebase();
    const agentId = DEMO_AGENT_ID;

    const agentRef = doc(firestore, 'agents', agentId);
    const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
    const sectionsRef = collection(firestore, `agents/${agentId}/customSections`);
    const reviewsRef = collection(firestore, `agents/${agentId}/reviews`);
    const leadsRef = collection(firestore, `agents/${agentId}/leads`);
    const contactsRef = collection(firestore, `agents/${agentId}/contacts`);

    try {
        const [agentSnap, propertiesSnap, sectionsSnap, reviewsSnap, leadsSnap, contactsSnap] = await Promise.all([
            getDoc(agentRef),
            getDocs(propertiesRef),
            getDocs(query(sectionsRef, orderBy('order', 'asc'))),
            getDocs(query(reviewsRef, orderBy('createdAt', 'desc'))),
            getDocs(query(leadsRef, orderBy('createdAt', 'desc'), limit(10))),
            getDocs(query(contactsRef, orderBy('createdAt', 'desc'))),
        ]);
        
        if (!agentSnap.exists()) {
            console.warn("Demo account not found, using fallback data.");
            return createInitialDemoData();
        }
        
        const agent = { id: 'demo-user-arthur', ...agentSnap.data() } as Agent;
        agent.role = 'corretor'; // Demote admin to prevent showing admin panel in demo

        const properties = propertiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
        const customSections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomSection));
        const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
        const leads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
        const contacts = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Contact));

        return { agent, properties, customSections, reviews, leads, contacts };

    } catch (error) {
        console.error("Failed to fetch demo account snapshot:", error);
        // Fallback to static data in case of Firestore error
        return createInitialDemoData();
    }
};

// --- Contexto ---
const DemoContext = createContext<DemoContextProps | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(getSessionStorage('isDemo', false));
  const [isLoading, setIsLoading] = useState(true);

  const [demoData, setDemoDataState] = useState<DemoDataContext>(() =>
    getSessionStorage('demo_data', createInitialDemoData())
  );

  const startDemo = useCallback(async () => {
    setIsLoading(true);
    const snapshot = await fetchDemoAccountSnapshot();
    setDemoDataState(snapshot);
    setSessionStorage('demo_data', snapshot);
    setIsDemo(true);
    setSessionStorage('isDemo', true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsDemo(getSessionStorage('isDemo', false));
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
