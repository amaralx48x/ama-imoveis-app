
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Percent, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { InfoCard } from '@/components/info-card';

const metricsFormSchema = z.object({
  defaultSaleCommission: z.coerce.number().min(0, "A comissão deve ser positiva.").max(100, "A comissão não pode ser maior que 100%."),
  defaultRentCommission: z.coerce.number().min(0, "A comissão deve ser positiva.").max(1000, "A comissão não pode ser maior que 1000%."),
});

function MetricsFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function MetricasPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof metricsFormSchema>>({
    resolver: zodResolver(metricsFormSchema),
    defaultValues: {
      defaultSaleCommission: 5,
      defaultRentCommission: 100,
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings) {
      form.reset({
        defaultSaleCommission: agentData.siteSettings.defaultSaleCommission || 5,
        defaultRentCommission: agentData.siteSettings.defaultRentCommission || 100,
      });
    }
  }, [agentData, form]);

  async function onSubmit(values: z.infer<typeof metricsFormSchema>) {
    if (!agentRef) return;
    
    const settingsToUpdate = {
        siteSettings: {
            defaultSaleCommission: values.defaultSaleCommission,
            defaultRentCommission: values.defaultRentCommission,
        }
    };
    
    try {
        await setDoc(agentRef, settingsToUpdate, { merge: true });
        mutate();

        toast({
            title: 'Configurações Salvas!',
            description: 'Seus percentuais de comissão padrão foram atualizados.',
        });
    } catch (error) {
        console.error("Erro ao salvar métricas:", error);
        toast({title: "Erro ao salvar", variant: "destructive"});
    }
  }

  return (
    <div className="space-y-6">
      <InfoCard cardId="metricas-info" title="Configure suas Comissões Padrão">
        <p>
          Defina aqui os percentuais de comissão que você geralmente utiliza em suas negociações. Estes valores servirão como um ponto de partida para agilizar seus cálculos.
        </p>
        <p>
          Quando você marcar um imóvel como "Vendido" ou "Alugado", o sistema usará o percentual correspondente para pré-preencher o campo de comissão, mas você sempre poderá ajustar o valor final manualmente.
        </p>
      </InfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Percent /> Métricas e Comissões
          </CardTitle>
          <CardDescription>
            Defina os percentuais padrão de comissão para suas transações. Estes valores serão sugeridos ao marcar um imóvel como vendido ou alugado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAgentLoading ? <MetricsFormSkeleton /> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="defaultSaleCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão Padrão de Venda (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" placeholder="Ex: 5" {...field} />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>Percentual padrão para o cálculo de comissão em vendas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultRentCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão Padrão de Aluguel (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                          <Input type="number" placeholder="Ex: 100" {...field} />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormDescription>Percentual sobre o primeiro aluguel. Ex: 100% para o valor total do primeiro mês.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {form.formState.isSubmitting ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                  </>
                ) : 'Salvar Configurações'}
              </Button>
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
