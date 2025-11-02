
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";

export type Theme = {
  headerColor: string;
  footerColor: string;
  textPrimary: string;
  textDynamic: boolean;
  backgroundPrimary: string;
  backgroundSecondary: string;
  buttonPrimary: string;
  buttonSecondary: string;
};

export type SavedTheme = {
  id: string;
  name: string;
  theme: Theme;
};


export const defaultTheme: Theme = {
  headerColor: "#1f2937", // gray-800
  footerColor: "#1f2937", // gray-800
  textPrimary: "#ffffff",
  textDynamic: true,
  backgroundPrimary: "#111827", // gray-900
  backgroundSecondary: "#374151", // gray-700
  buttonPrimary: "hsl(277 79% 53%)", // primary
  buttonSecondary: "hsl(282 100% 41%)", // accent
};

export const lightTheme: Theme = {
  headerColor: "#ffffff",
  footerColor: "#f3f4f6", // gray-100
  textPrimary: "#000000",
  textDynamic: true,
  backgroundPrimary: "#f9fafb", // gray-50
  backgroundSecondary: "#ffffff",
  buttonPrimary: "hsl(277 79% 53%)",
  buttonSecondary: "hsl(282 100% 41%)",
};


// Função de contraste inteligente
export function getContrastColor(bgColor: string): string {
    if (!bgColor.startsWith('#')) {
        // Se for uma cor HSL/RGB, o melhor é usar um fundo escuro ou claro padrão
        // A lógica de luminância é complexa sem converter para RGB primeiro.
        // Para simplificar, assumimos que cores não-hex são vibrantes e ficam bem com texto branco.
        return "#ffffff";
    }
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}


const ThemeContext = createContext<Theme>(defaultTheme);

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children, agentIdForPublicPage }: { children: ReactNode, agentIdForPublicPage?: string }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const { user } = useUser();
  const firestore = useFirestore();

  const agentId = agentIdForPublicPage || user?.uid;

  useEffect(() => {
    if (!agentId || !firestore) {
        setTheme(defaultTheme); // Fallback for public pages if no agentId
        return;
    };

    const unsub = onSnapshot(
      doc(firestore, "agents", agentId, "themes", "current"),
      (docSnap) => {
        if (docSnap.exists()) {
            setTheme(docSnap.data() as Theme);
        } else {
            setTheme(defaultTheme);
        }
      }
    );

    return () => unsub();
  }, [agentId, firestore]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={{
          "--header-color": theme.headerColor,
          "--footer-color": theme.footerColor,
          "--text-color": theme.textDynamic
            ? getContrastColor(theme.backgroundPrimary)
            : theme.textPrimary,
          "--bg-primary": theme.backgroundPrimary,
          "--bg-secondary": theme.backgroundSecondary,
          "--btn-primary": theme.buttonPrimary,
          "--btn-secondary": theme.buttonSecondary,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
