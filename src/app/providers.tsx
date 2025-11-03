'use client';

import { FirebaseClientProvider } from "@/firebase";
import { PlanProvider } from "@/context/PlanContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <PlanProvider>
        {children}
      </PlanProvider>
    </FirebaseClientProvider>
  );
}
