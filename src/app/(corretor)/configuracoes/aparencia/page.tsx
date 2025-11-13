
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Sun, Moon, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark'], { required_error: 'Por favor, selecione um tema.' }),
});

function AppearanceFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-24 w-32 rounded-md" />
                    <Skeleton className="h-24 w-32 rounded-md" />
                </div>
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function AparenciaPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: 'dark',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.theme) {
      form.reset({
        theme: agentData.siteSettings.theme,
      });
    }
  }, [agentData, form]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    // Atualiza o formulário
    form.setValue('theme', theme);
    // Aplica o tema imediatamente ao painel
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  };


  async function onSubmit(values: z.infer<typeof appearanceFormSchema>) {
    if (!agentRef) return;
    
    try {
        await setDoc(agentRef, { siteSettings: { theme: values.theme } }, { merge: true });
        mutate();

        toast({
            title: 'Tema Salvo!',
            description: 'A aparência do seu site público foi atualizada.',
        });
    } catch (error) {
        console.error("Erro ao salvar o tema:", error);
        toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar a aparência.',
            variant: 'destructive'
        });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
          <Palette /> Aparência
        </CardTitle>
        <CardDescription>
          Personalize a aparência do seu site público e do painel de controle. A alteração é aplicada instantaneamente neste painel para pré-visualização.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAgentLoading ? <AppearanceFormSkeleton /> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg font-semibold">Tema de Cores</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value: 'light' | 'dark') => handleThemeChange(value)}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem>
                        <RadioGroupItem value="light" id="light" className="peer sr-only" />
                        <Label
                          htmlFor="light"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Sun className="mb-3 h-6 w-6" />
                          Claro
                        </Label>
                      </FormItem>
                      <FormItem>
                        <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                        <Label
                           htmlFor="dark"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                           <Moon className="mb-3 h-6 w-6" />
                           Escuro
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>Selecione o tema para pré-visualizar. Clique em salvar para aplicar no site público.</FormDescription>
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
              ) : 'Salvar Aparência para o Site Público'}
            </Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
