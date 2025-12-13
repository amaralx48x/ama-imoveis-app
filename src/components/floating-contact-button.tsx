
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
        d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.77.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.78 1.21h.01c5.46 0 9.91-4.45 9.91-9.91c0-5.46-4.45-9.91-9.91-9.91zM17.53 15.3c-.27-.13-1.59-.78-1.84-.87c-.25-.09-.43-.13-.62.13c-.19.27-.7.87-.86 1.04c-.16.17-.32.19-.59.06c-1.39-.67-2.4-1.29-3.21-2.22c-.67-.78-1.12-1.58-1.29-1.95c-.17-.37-.02-.57.11-.7c.12-.12.27-.31.41-.46c.14-.15.19-.27.28-.46c.09-.19.05-.37-.02-.51c-.07-.13-.62-1.49-.84-2.03c-.23-.54-.46-.47-.62-.47c-.16 0-.34-.02-.52-.02c-.18 0-.46.07-.7.34c-.24.27-.92.89-1.12 2.14c-.2 1.25.12 2.76 1.39 4.39c1.07 1.37 2.14 2.5 4.39 3.53c.53.24 1.29.35 2.22.35c.93 0 1.7-.13 2.3-.43c.7-.35 1.25-.87 1.63-1.63c.24-.46.35-.98.35-1.52c0-.53-.11-.98-.24-1.36c-.13-.37-.28-.56-.45-.69c-.18-.13-.39-.2-.59-.2c-.2 0-.46.06-.63.13z"
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
            className="rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
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
