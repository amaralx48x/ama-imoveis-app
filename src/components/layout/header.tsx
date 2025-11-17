
'use client';
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "../ui/button";
import type { Agent } from '@/lib/data';
import { usePathname } from 'next/navigation';
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contact-form";
import { useState } from "react";

interface HeaderProps {
    agentName?: string;
    agentId?: string;
    agent?: Agent;
}

export function Header({ agentName, agentId, agent }: HeaderProps) {
  
  const siteName = agent?.name || agentName || "AMA Imóveis";
  const [isProprietarioFormOpen, setIsProprietarioFormOpen] = useState(false);
  
  const agentBaseUrl = agentId ? `/corretor/${agentId}` : '#';

  
  const navItems = [
      { href: `${agentBaseUrl}#sobre`, label: "Sobre" },
      { href: `${agentBaseUrl}#destaques`, label: "Destaques" },
      { href: `${agentBaseUrl}#avaliacoes`, label: "Avaliações" },
  ]

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href={agentBaseUrl} className="mr-6 flex items-center space-x-2">
            <span className="text-gradient">
              <Building2 className="h-6 w-6" />
            </span>
            <span className="font-bold font-headline text-lg">{siteName}</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navItems.map(item => (
                 <Link
                    key={item.href}
                    href={item.href}
                    className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                    {item.label}
                </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Dialog open={isProprietarioFormOpen} onOpenChange={setIsProprietarioFormOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost">Anuncie seu imóvel</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              {agentId && (
                <ContactForm
                  agentId={agentId}
                  title="Anuncie seu imóvel conosco"
                  description="Preencha os dados abaixo e entraremos em contato para avaliar e anunciar seu imóvel."
                  isDialog={true}
                  onFormSubmit={() => setIsProprietarioFormOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Button asChild>
            <Link href={`${agentBaseUrl}#footer`}>Fale Conosco</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
