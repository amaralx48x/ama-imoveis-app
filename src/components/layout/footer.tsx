
import { Facebook, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";
import type { Agent } from "@/lib/data";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);


interface FooterProps {
  agent?: Agent;
}

export function Footer({ agent }: FooterProps) {
  const socialLinks = agent?.siteSettings?.socialLinks;
  const whatsappNumber = socialLinks?.whatsapp?.replace(/\D/g, '');
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  return (
    <footer className="bg-card/50" id="footer">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
             <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {agent?.name || 'AMA Imóveis'}. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground/50">CRECI {agent?.creci || '123456-F'}</p>
          </div>
          <div className="flex space-x-4 mb-4 md:mb-0">
            {socialLinks?.facebook && <Link href={socialLinks.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><Facebook className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>}
            {socialLinks?.instagram && <Link href={socialLinks.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><Instagram className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>}
            {socialLinks?.linkedin && <Link href={socialLinks.linkedin} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><Linkedin className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>}
            {whatsappLink && <Link href={whatsappLink} aria-label="WhatsApp" target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" /></Link>}
          </div>
        </div>
        <div className="text-center mt-6 border-t border-border pt-6 text-muted-foreground text-xs">
          <Link href="#" className="hover:underline hover:text-foreground transition-colors">Política de Privacidade</Link>
          <span className="mx-2">|</span>
          <Link href="#" className="hover:underline hover:text-foreground transition-colors">Termos de Uso</Link>
        </div>
      </div>
    </footer>
  );
}
