
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
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { MarketingContent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Settings, Mail, MessageCircle } from 'lucide-react';

const settingsFormSchema = z.object({
  supportWhatsapp: z.string().optional(),
  supportEmail: z.string().email('E-mail inválido.').optional().or(z.literal('')),
});

function SettingsFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-8">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const marketingRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'marketing', 'content') : null),
        [firestore]
    );

    const { data: marketingData, isLoading, mutate } = useDoc<MarketingContent>(marketingRef);

    const form = useForm<z.infer<typeof settingsFormSchema>>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            supportWhatsapp: '',
            supportEmail: '',
        },
    });

    useEffect(() => {
        if (marketingData) {
            form.reset({
                supportWhatsapp: marketingData.supportWhatsapp || '',
                supportEmail: marketingData.supportEmail || 'amaralx48@gmail.com',
            });
        }
    }, [marketingData, form]);

    async function onSubmit(values: z.infer<typeof settingsFormSchema>) {
        if (!marketingRef) return;
        
        try {
            await setDoc(marketingRef, values, { merge: true });
            mutate();
            toast({
                title: 'Configurações Salvas!',
                description: 'Os contatos de suporte foram atualizados.',
            });
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast({title: "Erro ao salvar", variant: "destructive"});
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Settings/> Configurações Gerais</CardTitle>
                <CardDescription>Gerencie as configurações globais da plataforma.</CardDescription>
                </CardHeader>
            </Card>

            {isLoading ? <SettingsFormSkeleton /> : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contatos de Suporte</CardTitle>
                            <CardDescription>Estes contatos serão exibidos na página de marketing.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                name="supportWhatsapp"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><MessageCircle className="w-4 h-4"/> WhatsApp de Suporte</FormLabel>
                                        <FormDescription>Número que aparecerá para suporte prioritário.</FormDescription>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: 5511999999999"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                              <FormField
                                name="supportEmail"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4"/> E-mail de Suporte</FormLabel>
                                        <FormDescription>E-mail geral para contato e dúvidas.</FormDescription>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: suporte@amaimobi.com"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                        </CardContent>
                         <CardHeader>
                             <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                                {form.formState.isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                                ) : "Salvar Configurações"}
                            </Button>
                        </CardHeader>
                    </Card>
                </form>
                </Form>
            )}
        </div>
    )
}

    