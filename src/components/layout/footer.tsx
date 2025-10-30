import { Facebook, Instagram, Linkedin } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-card/50" id="footer">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
             <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} AMA Imóveis. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground/50">CRECI 123456-F</p>
          </div>
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link href="#" aria-label="Facebook">
              <Facebook className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
            <Link href="#" aria-label="Instagram">
              <Instagram className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
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
