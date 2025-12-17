
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
    maxCatalogPages: number;
}

interface PlanContextProps {
  plan: PlanType;
  limits: PlanLimits;
  currentPropertiesCount: number;
  currentCatalogPagesCount: number;
  isLoading: boolean;
  canAddNewProperty: () => boolean;
  canAddNewCatalogPage: () => boolean;
  planSettings: Record<PlanType, PlanLimits & { name: string; priceId: string }>;
}

const planSettings: Record<PlanType, PlanLimits & { name: string; priceId: string }> = {
    'simples': {
        name: 'Início',
        priceId: '',
        maxProperties: 30,
        canImportCSV: false,
        storageGB: 2,
        maxCatalogPages: 5,
    },
    'essencial': {
        name: 'Essencial',
        priceId: '',
        maxProperties: 350,
        canImportCSV: true,
        storageGB: 5,
        maxCatalogPages: 10,
    },
    'impulso': {
        name: 'Impulso',
        priceId: '',
        maxProperties: 1000,
        canImportCSV: true,
        storageGB: 10,
        maxCatalogPages: 20,
    },
    'expansao': {
        name: 'Expansão',
        priceId: '',
        maxProperties: 3000,
        canImportCSV: true,
        storageGB: 20,
        maxCatalogPages: 40,
    }
};

const defaultPlanContext: PlanContextProps = {
  plan: 'simples',
  limits: planSettings.simples,
  currentPropertiesCount: 0,
  currentCatalogPagesCount: 0,
  isLoading: true,
  canAddNewProperty: () => false,
  canAddNewCatalogPage: () => false,
  planSettings: planSettings,
};

const PlanContext = createContext<PlanContextProps>(defaultPlanContext);

export const PlanProvider = ({ children, agentId }: { children: ReactNode, agentId: string | null }) => {
  const firestore = useFirestore();
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [currentPropertiesCount, setCurrentPropertiesCount] = useState(0);
  const [currentCatalogPagesCount, setCurrentCatalogPagesCount] = useState(0);
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

  // Fetch current properties and catalog pages count in real-time
  useEffect(() => {
    if (agentId && firestore) {
      setIsLoading(true);
      
      const propertiesRef = collection(firestore, `agents/${agentId}/properties`);
      const catalogPagesRef = collection(firestore, `agents/${agentId}/catalogPages`);

      const unsubProperties = onSnapshot(propertiesRef, (snapshot) => {
          setCurrentPropertiesCount(snapshot.size);
      }, (error) => {
          console.error("Error fetching properties count:", error);
      });
      
      const unsubCatalogPages = onSnapshot(catalogPagesRef, (snapshot) => {
          setCurrentCatalogPagesCount(snapshot.size);
      }, (error) => {
          console.error("Error fetching catalog pages count:", error);
      });

      // Combine loading state logic
      const checkLoading = async () => {
          await Promise.all([
              getDoc(doc(firestore, `agents/${agentId}`)),
          ]);
          setIsLoading(false);
      }
      checkLoading();

      return () => {
          unsubProperties();
          unsubCatalogPages();
      };
    } else {
      setCurrentPropertiesCount(0);
      setCurrentCatalogPagesCount(0);
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

  const canAddNewCatalogPage = useCallback(() => {
    if (isLoading) return false;
    return currentCatalogPagesCount < limits.maxCatalogPages;
  }, [isLoading, currentCatalogPagesCount, limits.maxCatalogPages]);

  const value = {
    plan,
    limits,
    currentPropertiesCount,
    currentCatalogPagesCount,
    isLoading,
    canAddNewProperty,
    canAddNewCatalogPage,
    planSettings,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => useContext(PlanContext);
