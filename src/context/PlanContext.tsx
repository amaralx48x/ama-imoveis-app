
'use client';

import { collection, doc, onSnapshot } from 'firebase/firestore';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import type { Agent } from '@/lib/data';

export type PlanType = 'corretor' | 'imobiliaria';

interface PlanContextProps {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  limits: {
    maxProperties: number;
    canImportCSV: boolean;
    maxStorageMB: number;
  };
  currentPropertiesCount: number;
  simulatedStorageUsed: number;
  isLoading: boolean;
  canAddNewProperty: () => boolean;
  canUpload: () => boolean;
}

const defaultPlan: PlanContextProps = {
  plan: 'corretor',
  setPlan: () => {},
  limits: {
    maxProperties: 50,
    canImportCSV: false,
    maxStorageMB: 5 * 1024, // 5GB
  },
  currentPropertiesCount: 0,
  simulatedStorageUsed: 0,
  isLoading: true,
  canAddNewProperty: () => true,
  canUpload: () => true,
};

const PlanContext = createContext<PlanContextProps>(defaultPlan);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const agentRef = useMemoFirebase(() => (user && firestore ? doc(firestore, `agents/${user.uid}`) : null), [user, firestore]);
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  const [currentPropertiesCount, setCurrentPropertiesCount] = useState(0);
  const [isPropertyCountLoading, setIsPropertyCountLoading] = useState(true);

  // Derives plan from agentData, with 'corretor' as fallback
  const plan = agentData?.plan || 'corretor';
  // Derives simulated storage from agentData
  const simulatedStorageUsed = agentData?.simulatedStorageUsed || 0;

  useEffect(() => {
    if (user && firestore) {
      setIsPropertyCountLoading(true);
      const propertiesRef = collection(firestore, `agents/${user.uid}/properties`);
      const unsubscribe = onSnapshot(
        propertiesRef,
        (snapshot) => {
          setCurrentPropertiesCount(snapshot.size);
          setIsPropertyCountLoading(false);
        },
        (error) => {
          console.error("Error fetching properties count:", error);
          setIsPropertyCountLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setCurrentPropertiesCount(0);
      setIsPropertyCountLoading(false);
    }
  }, [user, firestore]);
  
  const setPlan = (newPlan: PlanType) => {
      if(agentRef) {
          // This should ideally be an update to the Firestore document.
          // For now, it's a client-side simulation.
          console.log(`Simulating plan change to ${newPlan}`);
      }
  }


  const limits = useMemo(() => {
    return plan === 'imobiliaria'
      ? {
          maxProperties: 300,
          canImportCSV: true,
          maxStorageMB: 20 * 1024, // 20GB
        }
      : {
          maxProperties: 50,
          canImportCSV: false,
          maxStorageMB: 5 * 1024, // 5GB
        };
  }, [plan]);

  const isLoading = isAgentLoading || isPropertyCountLoading;

  const canAddNewProperty = () => {
    if (isLoading) return false;
    return currentPropertiesCount < limits.maxProperties;
  };

  const canUpload = () => {
    if (isLoading) return false;
    // Convert MB to Bytes for comparison
    const maxStorageBytes = limits.maxStorageMB * 1024 * 1024;
    return simulatedStorageUsed < maxStorageBytes;
  }

  const value = {
    plan,
    setPlan,
    limits,
    currentPropertiesCount,
    simulatedStorageUsed,
    isLoading,
    canAddNewProperty,
    canUpload
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => useContext(PlanContext);
