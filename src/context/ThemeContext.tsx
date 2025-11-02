
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define o tipo para o objeto de tema
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

// Tema padrão como fallback
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

// Tema claro como opção pré-definida
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


// Função para calcular a cor de contraste (preto ou branco)
export function getContrastColor(bgColor: string): string {
    if (!bgColor) return "#000000"; // Fallback
    
    if (!bgColor.startsWith('#')) {
        // Assume-se que cores não hexadecimais são vibrantes o suficiente para texto branco.
        // Uma lógica mais complexa seria necessária para converter HSL/RGB para luminância.
        return "#ffffff";
    }

    try {
        const r = parseInt(bgColor.slice(1, 3), 16);
        const g = parseInt(bgColor.slice(3, 5), 16);
        const b = parseInt(bgColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? "#000000" : "#ffffff";
    } catch (e) {
        return "#000000"; // Fallback em caso de erro de parsing
    }
}


// Cria o contexto com um valor padrão
const ThemeContext = createContext<{ theme: Theme | null, setTheme: (theme: Theme) => void }>({
    theme: defaultTheme,
    setTheme: () => {}
});

// Hook para usar o tema
export const useTheme = () => useContext(ThemeContext);


// O Provedor de Tema que aplica as variáveis CSS
export const ThemeProvider = ({ theme: initialTheme, children }: { theme: Theme | null, children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState(initialTheme || defaultTheme);

  useEffect(() => {
    // Atualiza o tema se a prop inicial mudar
    setCurrentTheme(initialTheme || defaultTheme);
  }, [initialTheme]);

  useEffect(() => {
    // Aplica as variáveis CSS ao root do documento
    if (typeof window !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--header-color', currentTheme.headerColor);
        root.style.setProperty('--footer-color', currentTheme.footerColor);
        root.style.setProperty('--bg-primary', currentTheme.backgroundPrimary);
        root.style.setProperty('--bg-secondary', currentTheme.backgroundSecondary);
        root.style.setProperty('--btn-primary', currentTheme.buttonPrimary);
        root.style.setProperty('--btn-secondary', currentTheme.buttonSecondary);
        
        if (currentTheme.textDynamic) {
            root.style.setProperty('--text-color', getContrastColor(currentTheme.backgroundPrimary));
        } else {
            root.style.setProperty('--text-color', currentTheme.textPrimary);
        }
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
