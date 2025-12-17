'use client';

import { useState } from 'react';
import { useUser } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscribeButtonProps {
  priceId: string;
  isCurrentPlan: boolean;
}

export function SubscribeButton({ priceId, isCurrentPlan }: SubscribeButtonProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({ title: 'Você precisa estar logado para assinar.', variant: 'destructive' });
      return router.push('/login');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid, priceId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao criar sessão de checkout.');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Erro ao criar sessão:', error);
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSubscribe} disabled={loading || isCurrentPlan} className="w-full">
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isCurrentPlan ? (
        'Plano Atual'
      ) : (
        'Contratar Plano'
      )}
    </Button>
  );
}
