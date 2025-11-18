
"use client";

import {
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  Phone,
  MapPin,
  Mail,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Agent } from "@/lib/data";
import { defaultPrivacyPolicy, defaultTermsOfUse } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

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

function PolicyDialog({ title, content }: { title: string, content: string }) {
    const formatText = (text: string) => {
        return text
            .split('\n')
            .map((line, i) => {
                if (line.startsWith('## ')) return `<h2 key=${i} class="text-2xl font-bold mt-6 mb-3">${line.substring(3)}</h2>`;
                if (line.startsWith('**')) return `<p key=${i} class="font-bold mt-4">${line.replace(/\*\*/g, '')}</p>`;
                if (line.trim() === '') return '<br />';
                return `<p key=${i} class="text-muted-foreground leading-relaxed mb-2">${line}</p>`;
            })
            .join('');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                 <button className="hover:underline hover:text-foreground transition-colors">{title}</button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh]">
                 <DialogHeader>
                    <DialogTitle className="text-3xl font-headline">{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full">
                    <div className="prose dark:prose-invert max-w-none pr-6" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}


function FooterSkeleton() {
    return (
        <div className="flex justify-center gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                </div>
            ))}
        </div>
    )
}

export function Footer({ agentId }: { agentId?: string }) {
  const firestore = useFirestore();
  const agentRef = useMemoFirebase(
    () => (agentId && firestore ? doc(firestore, "agents", agentId) : null),
    [agentId, firestore]
  );
  
  const { data: agent, isLoading } = useDoc<Agent>(agentRef);
  
  const privacyPolicy = agent?.siteSettings?.privacyPolicy || defaultPrivacyPolicy;
  const termsOfUse = agent?.siteSettings?.termsOfUse || defaultTermsOfUse;

  const socialLinks = agent?.siteSettings?.socialLinks?.filter(l => l.icon !== 'map-pin' && l.icon !== 'phone') || [];
  const locationLink = agent?.siteSettings?.socialLinks?.find(l => l.icon === 'map-pin');
  const phoneLink = agent?.siteSettings?.socialLinks?.find(l => l.icon === 'phone');


  return (
    <footer id="footer" className="bg-muted">
      <div className="container mx-auto px-4 py-8">

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-6 min-h-[56px]">
            {/* Contatos Primários na Esquerda */}
            <div className="flex items-center gap-6 text-sm">
                {locationLink && (
                     <motion.a
                        key={locationLink.id}
                        href={formatLink(locationLink.icon, locationLink.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex text-muted-foreground hover:text-primary transition-all flex-row items-center gap-4 max-w-xs"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title={locationLink.label}
                     >
                        {locationLink.imageUrl && (
                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                <Image src={locationLink.imageUrl} alt={locationLink.label || "Foto do endereço"} fill sizes="64px" className="object-cover" />
                            </div>
                        )}
                        <div className="text-left">
                            <span className="font-semibold text-foreground">{locationLink.label}</span>
                            <p className="text-xs line-clamp-3">{locationLink.url}</p>
                        </div>
                    </motion.a>
                )}
                 {(locationLink && phoneLink) && <Separator orientation="vertical" className="h-10"/>}
                 {phoneLink && (
                    <motion.a
                        key={phoneLink.id}
                        href={formatLink(phoneLink.icon, phoneLink.url)}
                        className="flex flex-col text-left"
                         whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={phoneLink.label}
                    >
                         <span className="font-semibold text-foreground">{phoneLink.label}</span>
                        <p className="text-muted-foreground hover:text-primary transition-colors">{phoneLink.url}</p>
                    </motion.a>
                 )}
            </div>

            {/* Ícones Sociais no Centro/Direita */}
            <div className="flex flex-wrap justify-center items-center gap-6 flex-grow md:justify-end">
              {isLoading && <FooterSkeleton />}
              {!isLoading && socialLinks.map((link) => {
                const Icon = iconMap[link.icon] || Globe;
                const href = formatLink(link.icon, link.url);
                return (
                  <motion.a
                    key={link.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center text-muted-foreground hover:text-primary transition-all"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    title={link.label}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs">{link.label}</span>
                  </motion.a>
                );
              })}
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left border-t border-border pt-6">
           <div className="mb-4 md:mb-0">
             <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} AMA Tecnologia. Todos os direitos reservados.
            </p>
          </div>
          <div className="text-muted-foreground text-xs space-x-2">
              <PolicyDialog title="Política de Privacidade" content={privacyPolicy} />
              <span>|</span>
              <PolicyDialog title="Termos de Uso" content={termsOfUse} />
          </div>
        </div>
      </div>
    </footer>
  );
}
