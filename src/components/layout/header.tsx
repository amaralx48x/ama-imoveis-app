
'use client';
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "../ui/button";
import type { Agent } from '@/lib/data';
import { usePathname } from 'next/navigation';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);

interface HeaderProps {
    agentName?: string;
    agentId?: string;
    agent?: Agent;
}

export function Header({ agentName, agentId, agent }: HeaderProps) {
  
  const siteName = agent?.name || agentName || "AMA Imóveis";
  
  const agentBaseUrl = agentId ? `/corretor/${agentId}` : '#';

  const socialLinks = agent?.siteSettings?.socialLinks;
  const whatsappNumber = socialLinks?.whatsapp?.replace(/\D/g, '');
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
  
  const navItems = [
      { href: `${agentBaseUrl}#sobre`, label: "Sobre" },
      { href: `${agentBaseUrl}#destaques`, label: "Destaques" },
      { href: `${agentBaseUrl}#avaliacoes`, label: "Avaliações" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                    {item.label}
                </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {whatsappLink && (
            <Button asChild size="icon" className="rounded-full bg-green-500 hover:bg-green-600 text-white">
                <Link href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <WhatsAppIcon className="h-5 w-5" />
                </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`${agentBaseUrl}#contato`}>Fale Conosco</Link>
          </Button>
           <Button asChild variant="outline">
              <Link href="/login">Área do Corretor</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
