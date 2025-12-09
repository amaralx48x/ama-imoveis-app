
'use client';

import { collection, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { useFirestore } from '@/firebase';
import type { Agent } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export type PlanType = 'simples' | 'essencial' | 'impulso' | 'expansao';

interface PlanLimits {
    maxProperties: number;
    canImportCSV: boolean;
    storageGB: number;
}

interface PlanContextProps {
  plan: PlanType;
  limits: PlanLimits;
  currentPropertiesCount: number;
  isLoading: boolean;
  canAddNewProperty: () => boolean;
  planSettings: Record<PlanType, PlanLimits & { name: string; priceId: string }>;
}

const planSettings: Record<PlanType, PlanLimits & { name: string; priceId: string }> = {
    'simples': {
        name: 'Simples',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO1_PRICE_ID || 'price_simples',
        maxProperties: 30,
        canImportCSV: false,
        storageGB: 2,
    },
    'essencial': {
        name: 'Essencial',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO2_PRICE_ID || 'price_essencial',
        maxProperties: 350,
        canImportCSV: true,
        storageGB: 5,
    },
    'impulso': {
        name: 'Impulso',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO3_PRICE_ID || 'price_impulso',
        maxProperties: 1000,
        canImportCSV: true,
        storageGB: 10,
    },
    'expansao': {
        name: 'Expansão',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO4_PRICE_ID || 'price_expansao',
        maxProperties: 3000,
        canImportCSV: true,
        storageGB: 20,
    }
};

const defaultPlanContext: PlanContextProps = {
  plan: 'simples',
  limits: planSettings.simples,
  currentPropertiesCount: 0,
  isLoading: true,
  canAddNewProperty: () => false,
  planSettings: planSettings,
};

const PlanContext = createContext<PlanContextProps>(defaultPlanContext);

export const PlanProvider = ({ children, agentId }: { children: ReactNode, agentId: string | null }) => {
  const firestore = useFirestore();
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [currentPropertiesCount, setCurrentPropertiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agent data (including plan)
  useEffect(() => {
    if (agentId && firestore) {
      const agentRef = doc(firestore, `agents/${agentId}`);
      const unsubscribe = onSnapshot(agentRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Agent;
          if (data.plan && !Object.keys(planSettings).includes(data.plan)) {
              data.plan = 'simples'; 
          }
          setAgentData(data);
        }
        // Loading is handled by properties fetch
      }, (error) => {
        console.error("Error fetching agent data in PlanContext:", error);
      });
      return () => unsubscribe();
    } else {
        setAgentData(null);
    }
  }, [agentId, firestore]);

  // Fetch current properties count in real-time
  useEffect(() => {
    if (agentId && firestore) {
      setIsLoading(true);
      const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
      const unsubscribe = onSnapshot(
        propertiesRef,
        (snapshot) => {
          setCurrentPropertiesCount(snapshot.size);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching properties count in PlanContext:", error);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setCurrentPropertiesCount(0);
      setIsLoading(false);
    }
  }, [agentId, firestore]);
  
  const plan = agentData?.plan && Object.keys(planSettings).includes(agentData.plan) 
    ? agentData.plan as PlanType 
    : 'simples';

  const limits = useMemo(() => {
    return planSettings[plan];
  }, [plan]);

  const canAddNewProperty = useCallback(() => {
    if (isLoading) return false;
    return currentPropertiesCount < limits.maxProperties;
  }, [isLoading, currentPropertiesCount, limits.maxProperties]);

  const value = {
    plan,
    setPlan: () => {}, // setPlan is not implemented for clients
    limits,
    currentPropertiesCount,
    isLoading,
    canAddNewProperty,
    planSettings,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => useContext(PlanContext);
