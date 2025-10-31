'use client';
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "../ui/button";
import type { Agent } from '@/lib/data';

interface HeaderProps {
    agentName?: string;
}

export function Header({ agentName }: HeaderProps) {
  
  const siteName = agentName || "AMA Imóveis";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-gradient">
              <Building2 className="h-6 w-6" />
            </span>
            <span className="font-bold font-headline text-lg">{siteName}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/search"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Buscar Imóveis
            </Link>
            <Link
              href="#sobre"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Sobre
            </Link>
            <Link
              href="#destaques"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Destaques
            </Link>
             <Link
              href="#avaliacoes"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Avaliações
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button asChild>
            <Link href="#contato">Fale Conosco</Link>
          </Button>
           <Button asChild variant="outline">
              <Link href="/login">Área do Corretor</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
