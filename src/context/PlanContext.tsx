
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
import { useFirestore, useUser } from '@/firebase';
import type { Agent } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export type PlanType = 'simples' | 'essencial' | 'impulso' | 'expansao';

interface PlanLimits {
    maxProperties: number;
    canImportCSV: boolean;
    storageGB: number;
    aiDescriptions: boolean;
}

interface PlanContextProps {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
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
        aiDescriptions: false,
    },
    'essencial': {
        name: 'Essencial',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO2_PRICE_ID || 'price_essencial',
        maxProperties: 350,
        canImportCSV: true,
        storageGB: 5,
        aiDescriptions: true,
    },
    'impulso': {
        name: 'Impulso',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO3_PRICE_ID || 'price_impulso',
        maxProperties: 1000,
        canImportCSV: true,
        storageGB: 10,
        aiDescriptions: true,
    },
    'expansao': {
        name: 'Expansão',
        priceId: process.env.NEXT_PUBLIC_STRIPE_PLANO4_PRICE_ID || 'price_expansao',
        maxProperties: 3000,
        canImportCSV: true,
        storageGB: 20,
        aiDescriptions: true,
    }
};

const defaultPlanContext: PlanContextProps = {
  plan: 'simples',
  setPlan: () => {},
  limits: planSettings.simples,
  currentPropertiesCount: 0,
  isLoading: true,
  canAddNewProperty: () => false,
  planSettings: planSettings,
};

const PlanContext = createContext<PlanContextProps>(defaultPlanContext);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [currentPropertiesCount, setCurrentPropertiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch agent data (including plan)
  useEffect(() => {
    if (user && firestore) {
      const agentRef = doc(firestore, `agents/${user.uid}`);
      const unsubscribe = onSnapshot(agentRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Agent;
          // Ensure plan is valid, default if not
          if (data.plan && !Object.keys(planSettings).includes(data.plan)) {
              data.plan = 'simples'; 
          }
          setAgentData(data);
        }
        // No need to setIsLoading here, we do it in the properties fetch
      }, (error) => {
        console.error("Error fetching agent data:", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
        setAgentData(null);
    }
  }, [user, firestore]);

  // Fetch current properties count in real-time
  useEffect(() => {
    if (user && firestore) {
      setIsLoading(true);
      const propertiesRef = collection(firestore, `agents/${user.uid}/properties`);
      const unsubscribe = onSnapshot(
        propertiesRef,
        (snapshot) => {
          setCurrentPropertiesCount(snapshot.size);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching properties count:", error);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setCurrentPropertiesCount(0);
      setIsLoading(false);
    }
  }, [user, firestore]);
  
  const setPlan = useCallback(async (newPlan: PlanType) => {
    if (!user || !firestore || agentData?.role !== 'admin') {
        toast({
            title: "Permissão Negada",
            description: "Apenas administradores podem alterar o plano.",
            variant: "destructive"
        })
        return;
    };

    const agentRef = doc(firestore, 'agents', user.uid);
    try {
        await updateDoc(agentRef, { plan: newPlan });
        toast({
            title: "Plano Atualizado!",
            description: `O plano foi alterado para ${planSettings[newPlan].name}.`
        })
    } catch (error) {
        console.error("Erro ao atualizar plano:", error);
        toast({ title: "Erro ao salvar", variant: 'destructive'})
    }

  }, [user, firestore, agentData?.role, toast]);

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
    setPlan,
    limits,
    currentPropertiesCount,
    isLoading,
    canAddNewProperty,
    planSettings,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => useContext(PlanContext);
