'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRound, Loader2 } from 'lucide-react';
import { InfoCard } from '@/components/info-card';

type DemoSettings = {
    email?: string;
    password?: string;
}

const formSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function DemoAccountPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'systemSettings', 'demoAccount') : null),
    [firestore]
  );
  
  const { data: settingsData, isLoading, mutate } = useDoc<DemoSettings>(settingsRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (settingsData) {
      form.reset({
        email: settingsData.email || '',
        password: settingsData.password || '',
      });
    }
  }, [settingsData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!settingsRef) return;
    
    try {
        await setDoc(settingsRef, values, { merge: true });
        mutate();

        toast({
            title: 'Configurações Salvas!',
            description: 'As credenciais da conta de demonstração foram atualizadas.',
        });
    } catch (error) {
        console.error("Erro ao salvar as configurações da demo:", error);
        toast({title: "Erro ao salvar", variant: "destructive"});
    }
  }

  return (
    <div className="space-y-6">
      <InfoCard cardId="demo-account-info" title="Conta de Demonstração">
        <p>
          As credenciais inseridas aqui serão usadas quando um visitante clicar no botão "Testar demonstração" na página de login.
        </p>
        <p>
          Certifique-se de que esta conta <strong>exista de verdade</strong> e esteja populada com imóveis, avaliações e outras informações que você queira exibir como exemplo. As alterações feitas pelos visitantes durante a demo são visuais e não afetam os dados reais desta conta.
        </p>
      </InfoCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <KeyRound /> Conta de Demonstração
          </CardTitle>
          <CardDescription>
            Defina o e-mail e a senha da conta que será usada para a demonstração pública do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <SettingsSkeleton /> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail da Conta Demo</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="demo@exemplo.com" {...field} />
                    </FormControl>
                    <FormDescription>O e-mail de uma conta de corretor <strong>real</strong> e existente no sistema.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha da Conta Demo</FormLabel>
                    <FormControl>
                        <Input type="password" {...field} />
                    </FormControl>
                    <FormDescription>A senha correspondente à conta de e-mail acima.</FormDescription>
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
                ) : 'Salvar Credenciais da Demo'}
              </Button>
            </form>
          </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
