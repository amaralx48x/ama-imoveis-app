'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoCardProps {
  cardId: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoCard({ cardId, title, children, className }: InfoCardProps) {
  // Initialize state based on localStorage to prevent flash of content.
  const [isVisible, setIsVisible] = useState(() => {
    // This function runs only on initial render.
    if (typeof window !== 'undefined') {
      return localStorage.getItem(cardId) !== 'hidden';
    }
    // On the server, we assume it might be visible to avoid hydration mismatches,
    // but the useEffect below will correct it on the client.
    return true; 
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs once on the client to ensure correct visibility state.
    setIsClient(true);
    const preference = localStorage.getItem(cardId);
    if (preference === 'hidden') {
      setIsVisible(false);
    }
  }, [cardId]);


  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(cardId, 'hidden');
    }
    setIsVisible(false);
  };
  
  if (!isClient || !isVisible) {
      return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.3 } }}
          className={`overflow-hidden mb-6 ${className}`}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold text-primary">{title}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground space-y-2">{children}</div>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id={`dont-show-${cardId}`}
                  checked={dontShowAgain}
                  onCheckedChange={(checked) => setDontShowAgain(Boolean(checked))}
                />
                <Label htmlFor={`dont-show-${cardId}`} className="text-xs text-muted-foreground">
                  Não mostrar novamente
                </Label>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
