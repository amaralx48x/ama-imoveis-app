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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageUpload from '@/components/image-upload';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'O nome de exibição deve ter pelo menos 2 caracteres.' }),
  siteName: z.string().min(3, { message: 'O nome do site deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }).max(500, { message: 'A descrição não pode ter mais de 500 caracteres.' }),
  accountType: z.enum(['corretor', 'imobiliaria'], { required_error: 'Selecione um tipo de conta.' }),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

export default function PerfilPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate: revalidateAgent } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      siteName: '',
      description: '',
      accountType: 'corretor',
      photoUrl: '',
    },
  });

  useEffect(() => {
    if (agentData) {
      form.reset({
        displayName: agentData.displayName || '',
        siteName: agentData.name || '',
        description: agentData.description || '',
        accountType: agentData.accountType || 'corretor',
        photoUrl: agentData.photoUrl || '',
      });
    }
  }, [agentData, form]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!agentRef) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado. Não é possível salvar.',
        variant: 'destructive',
      });
      return;
    }
    
    const dataToSave = {
        displayName: values.displayName,
        name: values.siteName,
        description: values.description,
        accountType: values.accountType,
        photoUrl: values.photoUrl,
    };

    setDocumentNonBlocking(agentRef, dataToSave, { merge: true });

    toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
    });
  }

  const handleUploadComplete = (url: string) => {
    if (!agentRef) return;
    
    setDocumentNonBlocking(agentRef, { photoUrl: url }, { merge: true });

    toast({
      title: 'Foto Atualizada!',
      description: 'Sua foto de perfil foi alterada com sucesso.',
    });
    revalidateAgent();
    form.setValue('photoUrl', url);
  }

  if (isAgentLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Meu Perfil</CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais e de marca que serão exibidas no seu site público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto de Perfil</FormLabel>
                  <FormControl>
                    <div className='flex items-center gap-6'>
                       <Avatar className='h-24 w-24'>
                          <AvatarImage src={field.value} alt={form.getValues('displayName')} />
                          <AvatarFallback>{form.getValues('displayName')?.charAt(0) || 'A'}</AvatarFallback>
                        </Avatar>
                        {user && (
                           <ImageUpload 
                            agentId={user.uid}
                            onUploadComplete={handleUploadComplete}
                           />
                        )}
                    </div>
                  </FormControl>
                  <FormDescription>Esta é a sua foto de perfil pública.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu Nome de Exibição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ana Maria" {...field} />
                  </FormControl>
                  <FormDescription>Este é o nome que aparecerá no painel (ex: "Bom dia, Ana Maria!").</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Site / Imobiliária</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: AMA Imóveis" {...field} />
                  </FormControl>
                   <FormDescription>Este nome aparecerá no cabeçalho do seu site público.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobre Você / Sua Imobiliária</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva sua experiência, missão e valores..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Este texto será exibido na seção "Sobre" do seu site público.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Conta</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="corretor" />
                        </FormControl>
                        <FormLabel className="font-normal">Corretor(a)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="imobiliaria" />
                        </FormControl>
                        <FormLabel className="font-normal">Imobiliária</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>Isso ajuda a personalizar a linguagem em algumas partes do site.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
