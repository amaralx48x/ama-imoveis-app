
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
import { Loader2, Palette } from 'lucide-react';
import { InfoCard } from '@/components/info-card';

const colorSchema = z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, {
    message: "Formato inválido. Use HSL (ex: 262 86% 56%)"
}).optional().or(z.literal(''));

const colorsFormSchema = z.object({
  primary: colorSchema,
  accent: colorSchema,
});

function ColorsFormSkeleton() {
    return (
        <div className="space-y-8">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function CoresPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof colorsFormSchema>>({
    resolver: zodResolver(colorsFormSchema),
    defaultValues: {
      primary: '262 86% 56%',
      accent: '282 86% 51%',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.themeColors) {
      form.reset({
        primary: agentData.siteSettings.themeColors.primary || '262 86% 56%',
        accent: agentData.siteSettings.themeColors.accent || '282 86% 51%',
      });
    }
  }, [agentData, form]);

  async function onSubmit(values: z.infer<typeof colorsFormSchema>) {
    if (!agentRef) return;
    
    const settingsToUpdate = {
        siteSettings: {
            themeColors: {
                primary: values.primary,
                accent: values.accent,
            }
        }
    };
    
    try {
        await setDoc(agentRef, settingsToUpdate, { merge: true });
        mutate();

        toast({
            title: 'Cores Salvas!',
            description: 'As cores do seu site público foram atualizadas.',
        });
    } catch (error) {
        console.error("Erro ao salvar cores:", error);
        toast({title: "Erro ao salvar", variant: "destructive"});
    }
  }

  const primaryColor = form.watch('primary');
  const accentColor = form.watch('accent');

  return (
    <div className="space-y-6">
      <InfoCard cardId="cores-info" title="Personalize o Esquema de Cores">
        <p>
          Defina aqui as cores principais que darão identidade ao seu site. A "Cor Primária" e a "Cor de Destaque" são usadas para criar o gradiente em títulos e outros elementos importantes.
        </p>
        <p>
          As cores devem ser inseridas no formato HSL (Hue, Saturation, Lightness), sem o "hsl()". Por exemplo: <strong>262 86% 56%</strong>. Você pode usar um seletor de cores online para encontrar os valores HSL desejados.
        </p>
      </InfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Palette /> Cores do Site
          </CardTitle>
          <CardDescription>
            Personalize as cores primária e de destaque do seu site público.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAgentLoading ? <ColorsFormSkeleton /> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Primária (HSL)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input placeholder="Ex: 262 86% 56%" {...field} />
                        <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: `hsl(${field.value})` }} />
                      </div>
                    </FormControl>
                    <FormDescription>Esta é a cor principal do gradiente em destaque.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor de Destaque (HSL)</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                            <Input placeholder="Ex: 282 86% 51%" {...field} />
                             <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: `hsl(${field.value})` }} />
                        </div>
                    </FormControl>
                    <FormDescription>Esta é a cor secundária do gradiente em destaque.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium">Pré-visualização do Gradiente:</p>
                <div 
                    className="p-4 rounded-md text-center font-bold text-2xl" 
                    style={{ background: `linear-gradient(to right, hsl(${primaryColor}), hsl(${accentColor}))`, color: 'white' }}
                >
                    Texto em Destaque
                </div>
              </div>


              <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {form.formState.isSubmitting ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                  </>
                ) : 'Salvar Cores'}
              </Button>
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
