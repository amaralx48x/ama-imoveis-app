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
    <svg viewBox="0 0 32 32" className="w-5 h-5" {...props}><path d=" M19.11 17.205c-.372 0-1.088 1.39-1.088 1.39s-1.088-1.39-1.088-1.39c-1.615 0-2.822-1.207-2.822-2.822s1.207-2.822 2.822-2.822c.433 0 .837.103 1.188.29l-1.188-1.188-1.188 1.188c-.35-.187-.755-.29-1.188-.29-1.615 0-2.822 1.207-2.822 2.822s1.207 2.822 2.822 2.822c.372 0 1.088-1.39 1.088-1.39s1.088 1.39 1.088 1.39c1.615 0 2.822-1.207 2.822-2.822s-1.207-2.822-2.822-2.822c-.433 0-.837.103-1.188.29l1.188-1.188-1.188 1.188c.35-.187.755-.29 1.188-.29 1.615 0 2.822 1.207 2.822 2.822s-1.207 2.822-2.822-2.822z" fill="currentColor"></path></svg>
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
                            <WhatsAppIcon className="mr-2" />
                            Falar pelo WhatsApp
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
