'use client';
import Link from "next/link";
import Image from "next/image";
import { Building2, Facebook, Instagram, Linkedin, Globe, Phone, MapPin, Mail, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import type { Agent } from '@/lib/data';
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contact-form";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
    agentName?: string;
    agentId?: string;
    agent?: Agent;
}

const iconMap: Record<string, any> = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  globe: Globe,
  phone: Phone,
  "map-pin": MapPin,
  mail: Mail,
};

function formatLink(type: string, value: string): string {
  if (!value) return '#';
  switch (type) {
    case 'whatsapp':
      return `https://wa.me/${value.replace(/\D/g, '')}`;
    case 'instagram':
      return `https://instagram.com/${value.replace('@', '')}`;
    case 'phone':
      return `tel:${value.replace(/\D/g, '')}`;
    case 'mail':
      return `mailto:${value}`;
    case 'map-pin':
      return `https://www.google.com/maps?q=${encodeURIComponent(value)}`;
    case 'facebook':
    case 'linkedin':
    case 'globe':
      return value.startsWith('http') ? value : `https://${value}`;
    default:
      return value;
  }
}

export function Header({ agentName, agentId, agent }: HeaderProps) {
  
  const siteName = agent?.name || agentName || "AMA Imóveis";
  const logoUrl = agent?.siteSettings?.logoUrl;
  const [isProprietarioFormOpen, setIsProprietarioFormOpen] = useState(false);
  
  const socialLinks = agent?.siteSettings?.socialLinks || [];
  
  // Se houver um agentId, a URL base é a página do corretor.
  // Caso contrário, a URL base é a página de marketing principal.
  const agentBaseUrl = agentId ? `/corretor/${agentId}` : '/';

  
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
            {logoUrl ? (
              <Image src={logoUrl} alt={`Logotipo de ${siteName}`} width={32} height={32} className="rounded-md" />
            ) : (
              <span className="text-gradient">
                <Building2 className="h-6 w-6" />
              </span>
            )}
            <span className="font-bold font-headline text-lg">{siteName}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map(item => (
                 <Link
                    key={item.href}
                    href={item.href}
                    className="transition-colors hover:text-foreground/80 text-muted-foreground font-medium"
                >
                    {item.label}
                </Link>
            ))}
             {socialLinks.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="transition-colors hover:text-foreground/80 text-muted-foreground font-medium">
                        Contatos <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                    {socialLinks.map((link) => {
                        const Icon = iconMap[link.icon] || Globe;
                        const href = formatLink(link.icon, link.url);
                        return (
                        <DropdownMenuItem key={link.id} asChild>
                            <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{link.label}</span>
                            </a>
                        </DropdownMenuItem>
                        );
                    })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
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
          
          <ThemeToggle />

          <Button asChild>
            <Link href={`${agentBaseUrl}#footer`}>Fale Conosco</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
