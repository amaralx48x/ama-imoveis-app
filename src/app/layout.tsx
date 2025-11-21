
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Inter, Poppins } from 'next/font/google'
import { FirebaseClientProvider } from "@/firebase";
import { PlanProvider } from "@/context/PlanContext";

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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable} dark`}>
      <body className={`font-body antialiased`}>
        <FirebaseClientProvider>
            <PlanProvider>
              {children}
            </PlanProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
