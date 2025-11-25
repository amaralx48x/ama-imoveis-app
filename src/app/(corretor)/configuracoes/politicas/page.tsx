
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { defaultPrivacyPolicy, defaultTermsOfUse } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoCard } from '@/components/info-card';


const policiesFormSchema = z.object({
  privacyPolicy: z.string().min(100, "A Política de Privacidade parece muito curta."),
  termsOfUse: z.string().min(100, "Os Termos de Uso parecem muito curtos."),
});

function PoliciesFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function PoliticasPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof policiesFormSchema>>({
    resolver: zodResolver(policiesFormSchema),
    defaultValues: {
      privacyPolicy: '',
      termsOfUse: '',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings) {
      form.reset({
        privacyPolicy: agentData.siteSettings.privacyPolicy || defaultPrivacyPolicy,
        termsOfUse: agentData.siteSettings.termsOfUse || defaultTermsOfUse,
      });
    } else if (!isAgentLoading) {
        form.reset({
            privacyPolicy: defaultPrivacyPolicy,
            termsOfUse: defaultTermsOfUse,
        });
    }
  }, [agentData, form, isAgentLoading]);

  async function onSubmit(values: z.infer<typeof policiesFormSchema>) {
    if (!agentRef) return;
    
    const settingsToUpdate = {
        siteSettings: {
            privacyPolicy: values.privacyPolicy,
            termsOfUse: values.termsOfUse,
        }
    };

    try {
        await setDoc(agentRef, settingsToUpdate, { merge: true });
        mutate();

        toast({
            title: 'Configurações Salvas!',
            description: 'Seus documentos de políticas e termos foram atualizados.',
        });
    } catch (error) {
        console.error("Erro ao salvar políticas:", error);
        toast({title: "Erro ao salvar", variant: "destructive"});
    }
  }

  return (
    <div className="space-y-6">
        <InfoCard cardId="politicas-info" title="Documentos Legais do seu Site">
            <p>
                A <strong>Política de Privacidade</strong> informa seus visitantes sobre como você coleta e usa os dados deles, um requisito da Lei Geral de Proteção de Dados (LGPD).
            </p>
            <p>
                Os <strong>Termos de Uso</strong> estabelecem as regras para a utilização do seu site. Fornecemos modelos padrão para ambos, mas você pode personalizá-los conforme a necessidade do seu negócio.
            </p>
        </InfoCard>

        <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <FileText /> Políticas e Termos
            </CardTitle>
            <CardDescription>
            Edite os textos da sua Política de Privacidade e dos Termos de Uso. Usamos um modelo padrão para sua segurança, mas você pode ajustá-lo conforme necessário.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isAgentLoading ? <PoliciesFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue="privacy">
                    <TabsList className="mb-4">
                        <TabsTrigger value="privacy">Política de Privacidade</TabsTrigger>
                        <TabsTrigger value="terms">Termos de Uso</TabsTrigger>
                    </TabsList>
                    <TabsContent value="privacy">
                        <FormField
                        control={form.control}
                        name="privacyPolicy"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-lg font-semibold">Conteúdo da Política de Privacidade</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[400px] font-mono text-xs" {...field} />
                            </FormControl>
                            <FormDescription>Modelo baseado na Lei Geral de Proteção de Dados (LGPD) do Brasil.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </TabsContent>
                    <TabsContent value="terms">
                        <FormField
                        control={form.control}
                        name="termsOfUse"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-lg font-semibold">Conteúdo dos Termos de Uso</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[400px] font-mono text-xs" {...field} />
                            </FormControl>
                            <FormDescription>Modelo padrão para sites de prestação de serviço.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </TabsContent>
                </Tabs>
                

                <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                ) : 'Salvar Alterações'}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
