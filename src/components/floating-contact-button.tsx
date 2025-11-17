
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Home, Building } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import type { Agent, SocialLink } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ContactForm } from './contact-form';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M16.75 13.96c.25.42.43.87.55 1.36c.12.49.11 1.01-.04 1.5c-.15.49-.43.95-.83 1.32c-.4.37-.89.65-1.42.82c-.53.17-1.09.23-1.64.15c-.55-.08-1.09-.27-1.6-.54c-2.43-1.28-4.5-3.35-5.78-5.78c-.27-.51-.46-1.05-.54-1.6c-.08-.55-.02-1.11.15-1.64c.17-.53.45-1.02.82-1.42c.37-.4.83-.68 1.32-.83c.49-.15 1.01-.16 1.5-.04c.49.12.94.3 1.36.55c.42.25.78.58 1.07.98c.29.4.49.85.6 1.34c.11.49.11.99.02 1.48c-.1.49-.32.96-.63 1.38l-1.3 1.3c-.02.02-.03.05-.03.08c.01.21.08.41.19.6c.11.19.26.36.44.52c.49.49 1.04.88 1.63 1.15c.16.08.34.13.52.14c.03 0 .06-.01.08-.03l1.3-1.3c.42-.31.89-.52 1.38-.63c.49-.09.99-.09 1.48.02c.49.11.94.31 1.34.6c.4.29.73.65.98 1.07zM12 2a10 10 0 1 1 0 20a10 10 0 0 1 0-20z"
      />
    </svg>
);


interface FloatingContactButtonProps {
    whatsAppLink: SocialLink;
    agent: Agent;
}

function formatLink(type: string, value: string): string {
    if (!value) return '#';
    switch (type) {
      case 'whatsapp':
        return `https://wa.me/${value.replace(/\D/g, '')}`;
      default:
        return value.startsWith('http') ? value : `https://${value}`;
    }
}

export function FloatingContactButton({ whatsAppLink, agent }: FloatingContactButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const href = formatLink(whatsAppLink.icon, whatsAppLink.url);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
             <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute bottom-[calc(100%+1rem)] right-0"
            >
                <Card className="w-72 shadow-xl">
                    <CardHeader>
                        <CardTitle>Fale Conosco!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild className="w-full bg-green-500 hover:bg-green-600">
                            <Link href={href} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="mr-2 h-5 w-5" />
                            WhatsApp
                            </Link>
                        </Button>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="w-full">
                                  <Building className="mr-2 h-4 w-4" /> Venda ou Alugue seu Imóvel
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[480px]">
                               <ContactForm 
                                agentId={agent.id} 
                                title="Anuncie seu imóvel conosco"
                                description="Preencha os dados abaixo e entraremos em contato para avaliar e anunciar seu imóvel."
                                isDialog={true}
                                onFormSubmit={() => setIsFormOpen(false)}
                               />
                          </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90"
            aria-label={isOpen ? 'Fechar contato' : 'Abrir contato'}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={isOpen ? 'x' : 'message'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
              </motion.div>
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>
    </>
  );
}

    