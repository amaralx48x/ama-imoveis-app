
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
                    <div className="prose prose-invert max-w-none pr-6" dangerouslySetInnerHTML={{ __html: formatText(content) }} />
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


  return (
    <footer className="bg-card/50" id="footer">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center items-start gap-6 mb-6 min-h-[56px]">
          {isLoading && <FooterSkeleton />}
          {!isLoading && agent?.siteSettings?.socialLinks?.map((link) => {
            const Icon = iconMap[link.icon] || Globe;
            const href = formatLink(link.icon, link.url);
            const isLocationWithImage = link.icon === 'map-pin' && link.imageUrl;

            return (
              <motion.a
                key={link.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex text-muted-foreground hover:text-primary transition-all ${isLocationWithImage ? 'flex-row items-center gap-3 p-3 rounded-lg bg-background/50 border max-w-xs w-full' : 'flex-col items-center'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={link.label}
              >
                {isLocationWithImage && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={link.imageUrl!} alt={`Foto de ${link.label}`} fill className="object-cover" />
                  </div>
                )}
                {!isLocationWithImage && <Icon className="w-6 h-6 mb-1" />}

                <div className={isLocationWithImage ? 'text-left' : 'text-center'}>
                    <span className={`text-xs ${isLocationWithImage ? 'font-semibold text-foreground' : ''}`}>{link.label}</span>
                    {isLocationWithImage && <p className="text-xs text-muted-foreground line-clamp-2">{link.url}</p>}
                </div>

              </motion.a>
            );
          })}
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
