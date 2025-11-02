'use client';

import { collection, getDocs } from 'firebase/firestore';
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { useFirestore, useUser } from '@/firebase';

export type PlanType = 'corretor' | 'imobiliaria';

interface PlanContextProps {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  limits: {
    maxProperties: number;
    canImportCSV: boolean;
    canAddCNPJ: boolean; // This is a placeholder, as the field doesn't exist yet
    canAddAddress: boolean; // This is a placeholder
    canAddPrice: boolean; // This is a placeholder
  };
  currentPropertiesCount: number;
  isLoading: boolean;
  canAddNewProperty: () => boolean;
}

const defaultPlan: PlanContextProps = {
  plan: 'corretor',
  setPlan: () => {},
  limits: {
    maxProperties: 30,
    canImportCSV: false,
    canAddCNPJ: false,
    canAddAddress: true, // Address is a core feature
    canAddPrice: true, // Price is a core feature
  },
  currentPropertiesCount: 0,
  isLoading: true,
  canAddNewProperty: () => true,
};

const PlanContext = createContext<PlanContextProps>(defaultPlan);

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [plan, setPlanState] = useState<PlanType>('corretor'); // Default plan
  const [currentPropertiesCount, setCurrentPropertiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch current properties count
  useEffect(() => {
    if (user && firestore) {
      setIsLoading(true);
      const propertiesRef = collection(firestore, `agents/${user.uid}/properties`);
      getDocs(propertiesRef)
        .then((snapshot) => {
          setCurrentPropertiesCount(snapshot.size);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user, firestore]);

  const setPlan = (newPlan: PlanType) => setPlanState(newPlan);

  const limits = useMemo(() => {
    return plan === 'imobiliaria'
      ? {
          maxProperties: Infinity,
          canImportCSV: true,
          canAddCNPJ: true, // Placeholder
          canAddAddress: true, // Placeholder
          canAddPrice: true, // Placeholder
        }
      : {
          maxProperties: 30,
          canImportCSV: false,
          canAddCNPJ: false, // Placeholder
          canAddAddress: true, // Placeholder
          canAddPrice: true, // Placeholder
        };
  }, [plan]);

  const canAddNewProperty = () => {
    return currentPropertiesCount < limits.maxProperties;
  };

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
