import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Inter, Poppins } from 'next/font/google'
import { FirebaseClientProvider } from "@/firebase";
import { PlanProvider } from "@/context/PlanContext";
import { DemoProvider, useDemo } from "@/context/DemoContext";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})
 
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: "AMA Imóveis",
  description: "Encontre o imóvel dos seus sonhos.",
};

function DemoRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDemo = searchParams.get('demo') === 'true';

    useEffect(() => {
        if (isDemo) {
            // Se o modo demo está ativo, redirecione para o painel
            // e anexe o parâmetro para que o resto do app saiba.
            router.replace('/dashboard?demo=true');
        }
    }, [isDemo, router]);

    // Este componente não renderiza nada visível, apenas lida com o efeito.
    return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable} dark`}>
      <body className={`font-body antialiased`}>
        <Suspense fallback={<div>Carregando...</div>}>
          <DemoProvider>
            <FirebaseClientProvider>
              <PlanProvider>
                <Suspense fallback={null}>
                    <DemoRedirect />
                </Suspense>
                {children}
              </PlanProvider>
            </FirebaseClientProvider>
          </DemoProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
