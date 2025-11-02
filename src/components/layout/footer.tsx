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
import { useEffect, useState } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Agent } from "@/lib/data";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";

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

  return (
    <footer className="bg-card/50" id="footer">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {isLoading && <FooterSkeleton />}
          {!isLoading && agent?.siteSettings?.socialLinks?.map((link) => {
            const Icon = iconMap[link.icon] || Globe;
            return (
              <motion.a
                key={link.id}
                href={link.url}
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

        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left border-t border-border pt-6">
           <div className="mb-4 md:mb-0">
             <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {agent?.name || 'AMA Imóveis'}. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground/50">CRECI {agent?.creci || '123456-F'}</p>
          </div>
          <div className="text-muted-foreground text-xs">
              <Link href="#" className="hover:underline hover:text-foreground transition-colors">Política de Privacidade</Link>
              <span className="mx-2">|</span>
              <Link href="#" className="hover:underline hover:text-foreground transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
