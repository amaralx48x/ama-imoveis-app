'use client';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Props = {
  priceId: string;
  email?: string | null;
  userId?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
};

export default function SubscribeButton({ priceId, email, userId, children, variant, className }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, customerEmail: email, userId }),
      });

      // Check if the response is successful, not just if it exists
      if (!res.ok) {
        // Try to parse the error message from the server
        const errorData = await res.json().catch(() => ({ error: 'O servidor retornou uma resposta inválida.' }));
        throw new Error(errorData.error || `Erro do servidor: ${res.statusText}`);
      }

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        // This case handles a successful response but with missing URL
        throw new Error('A resposta do servidor não continha a URL de checkout.');
      }
    } catch (err: any) {
      console.error('Erro ao criar sessão:', err);
      toast({ 
          title: 'Erro ao iniciar pagamento', 
          description: err.message || 'Não foi possível se comunicar com o servidor de pagamento.',
          variant: 'destructive'
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSubscribe} className={className} variant={variant} disabled={isLoading}>
      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aguarde...</> : children || 'Assinar'}
    </Button>
  );
}
