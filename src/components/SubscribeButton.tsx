'use client';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';

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
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error('Erro ao criar sessão', data);
        toast({ title: 'Erro ao iniciar pagamento', description: data.error, variant: 'destructive'});
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao iniciar pagamento', variant: 'destructive'});
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
