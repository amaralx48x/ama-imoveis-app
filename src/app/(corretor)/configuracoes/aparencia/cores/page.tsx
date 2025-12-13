
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
import { Loader2, Palette, Check } from 'lucide-react';
import { InfoCard } from '@/components/info-card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const gradients = [
    { name: 'Padrão (Roxo/Rosa)', from: 'hsl(262 86% 56%)', to: 'hsl(330 86% 56%)' },
    { name: 'Oceano (Azul/Verde)', from: 'hsl(210 90% 50%)', to: 'hsl(160 80% 40%)' },
    { name: 'Pôr do Sol (Laranja/Amarelo)', from: 'hsl(30 90% 55%)', to: 'hsl(50 100% 50%)' },
    { name: 'Esmeralda (Verde/Ciano)', from: 'hsl(145 70% 45%)', to: 'hsl(175 80% 40%)' },
    { name: 'Vibrante (Rosa/Laranja)', from: 'hsl(340 90% 60%)', to: 'hsl(20 95% 55%)' },
];

const colorsFormSchema = z.object({
  colorMode: z.enum(['gradient', 'solid']),
  selectedGradient: z.string().optional(),
  solidColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Formato de cor inválido. Use o formato hexadecimal (ex: #RRGGBB).").optional().or(z.literal('')),
});

function ColorsFormSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
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
      colorMode: 'gradient',
      selectedGradient: 'Padrão (Roxo/Rosa)',
      solidColor: '#8A2BE2',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.themeColors) {
      form.reset({
        colorMode: agentData.siteSettings.themeColors.mode || 'gradient',
        selectedGradient: agentData.siteSettings.themeColors.gradientName || 'Padrão (Roxo/Rosa)',
        solidColor: agentData.siteSettings.themeColors.solid || '#8A2BE2',
      });
    }
  }, [agentData, form]);

  async function onSubmit(values: z.infer<typeof colorsFormSchema>) {
    if (!agentRef) return;
    
    const settingsToUpdate = {
        siteSettings: {
            themeColors: {
                mode: values.colorMode,
                gradientName: values.selectedGradient,
                solid: values.solidColor,
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

  return (
    <div className="space-y-6">
      <InfoCard cardId="cores-info" title="Personalize o Esquema de Cores">
        <p>
          Escolha uma das nossas paletas de gradiente pré-definidas para dar um toque profissional ao seu site, ou selecione uma única cor sólida para uma aparência mais minimalista.
        </p>
      </InfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Palette /> Cores do Site
          </CardTitle>
          <CardDescription>
            Escolha entre gradientes pré-definidos ou uma cor sólida para os destaques do seu site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAgentLoading ? <ColorsFormSkeleton /> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="colorMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Modo de Cor</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl><RadioGroupItem value="gradient" /></FormControl>
                          <FormLabel className="font-normal">Gradiente</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl><RadioGroupItem value="solid" /></FormControl>
                          <FormLabel className="font-normal">Cor Sólida</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('colorMode') === 'gradient' && (
                 <FormField
                  control={form.control}
                  name="selectedGradient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selecione um Gradiente</FormLabel>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {gradients.map(gradient => (
                                <div key={gradient.name}
                                    onClick={() => field.onChange(gradient.name)}
                                    className={cn("p-4 rounded-md cursor-pointer border-2 flex items-center justify-between transition-all",
                                        field.value === gradient.name ? "border-primary" : "border-muted"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full" style={{ background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})` }}/>
                                        <span className="font-medium">{gradient.name}</span>
                                    </div>
                                    {field.value === gradient.name && <Check className="h-5 w-5 text-primary"/>}
                                </div>
                            ))}
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('colorMode') === 'solid' && (
                <FormField
                  control={form.control}
                  name="solidColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor Sólida Personalizada</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                           <Input type="color" {...field} className="p-1 h-10 w-14 cursor-pointer" />
                           <Input 
                              placeholder="Ex: #8A2BE2" 
                              value={field.value}
                              onChange={field.onChange}
                              className="w-32"
                            />
                        </div>
                      </FormControl>
                      <FormDescription>Escolha uma cor visualmente ou insira o código hexadecimal.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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
