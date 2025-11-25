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

export type PlanType = 'corretor' | 'imobiliaria';

interface PlanLimits {
    maxProperties: number;
    canImportCSV: boolean;
    storageGB: number;
}

interface PlanContextProps {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  limits: PlanLimits;
  currentPropertiesCount: number;
  isLoading: boolean;
  canAddNewProperty: () => boolean;
}

const planSettings: Record<PlanType, PlanLimits> = {
    'corretor': {
        maxProperties: 50,
        canImportCSV: false,
        storageGB: 5,
    },
    'imobiliaria': {
        maxProperties: 300,
        canImportCSV: true,
        storageGB: 10,
    }
}

const defaultPlanContext: PlanContextProps = {
  plan: 'corretor',
  setPlan: () => {},
  limits: planSettings.corretor,
  currentPropertiesCount: 0,
  isLoading: true,
  canAddNewProperty: () => false,
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
          setAgentData(docSnap.data() as Agent);
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
            description: `O plano foi alterado para ${newPlan === 'corretor' ? 'AMAPLUS' : 'AMA ULTRA'}.`
        })
    } catch (error) {
        console.error("Erro ao atualizar plano:", error);
        toast({ title: "Erro ao salvar", variant: 'destructive'})
    }

  }, [user, firestore, agentData?.role, toast]);

  const plan = agentData?.plan || 'corretor';

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
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => useContext(PlanContext);
