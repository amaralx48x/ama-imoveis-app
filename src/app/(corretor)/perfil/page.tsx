
'use client';
import { useForm, Controller } from 'react-hook-form';
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ImageUpload from '@/components/image-upload';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { X, Plus, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'O nome de exibição deve ter pelo menos 2 caracteres.' }),
  siteName: z.string().min(3, { message: 'O nome do site deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }).max(500, { message: 'A descrição não pode ter mais de 500 caracteres.' }),
  accountType: z.enum(['corretor', 'imobiliaria'], { required_error: 'Selecione um tipo de conta.' }),
  photoUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  availabilityDays: z.object({
    Segunda: z.boolean(),
    Terça: z.boolean(),
    Quarta: z.boolean(),
    Quinta: z.boolean(),
    Sexta: z.boolean(),
    Sábado: z.boolean(),
    Domingo: z.boolean(),
  }),
  availabilityStartTime: z.string(),
  availabilityEndTime: z.string(),
});

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const;

export default function PerfilPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const [newCity, setNewCity] = useState('');

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      siteName: '',
      description: '',
      accountType: 'corretor',
      photoUrl: '',
      phone: '',
      availabilityDays: { Segunda: false, Terça: false, Quarta: false, Quinta: false, Sexta: false, Sábado: false, Domingo: false },
      availabilityStartTime: '09:00',
      availabilityEndTime: '18:00',
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
        phone: agentData.phone || '',
        availabilityDays: agentData.availability?.days || { Segunda: false, Terça: false, Quarta: false, Quinta: false, Sexta: false, Sábado: false, Domingo: false },
        availabilityStartTime: agentData.availability?.startTime || '09:00',
        availabilityEndTime: agentData.availability?.endTime || '18:00',
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
        phone: values.phone,
        availability: {
          days: values.availabilityDays,
          startTime: values.availabilityStartTime,
          endTime: values.availabilityEndTime,
        }
    };

    setDocumentNonBlocking(agentRef, dataToSave, { merge: true });

    toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
    });
  }

  const handleUploadComplete = (urls: string[]) => {
    if (!agentRef) return;
    const photoUrl = urls[0]; // Take the first URL from the array
    if (photoUrl) {
        setDocumentNonBlocking(agentRef, { photoUrl: photoUrl }, { merge: true });
        form.setValue('photoUrl', photoUrl);
        toast({
        title: 'Foto Atualizada!',
        description: 'Sua foto de perfil foi alterada.',
        });
    }
  }

  const handleAddCity = async () => {
    if (!agentRef || !newCity.trim()) return;
    if (agentData?.cities?.includes(newCity.trim())) {
      toast({ title: "Cidade já existe", variant: "destructive" });
      return;
    }
    updateDocumentNonBlocking(agentRef, { cities: arrayUnion(newCity.trim()) });
    mutate(); // re-fetch data
    setNewCity('');
  };

  const handleRemoveCity = async (cityToRemove: string) => {
    if (!agentRef) return;
    updateDocumentNonBlocking(agentRef, { cities: arrayRemove(cityToRemove) });
     mutate(); // re-fetch data
  };

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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone Principal</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                   <FormDescription>Este será o número padrão para contato, caso um número específico não seja definido no imóvel.</FormDescription>
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

             <Separator />

             {/* Seção de Disponibilidade */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-bold font-headline flex items-center gap-2 mb-2"><CalendarDays/> Disponibilidade para Visitas</h3>
                    <p className="text-muted-foreground text-sm">Defina seus dias e horários de trabalho para que os clientes possam solicitar agendamentos.</p>
                </div>

                <FormField
                    control={form.control}
                    name="availabilityDays"
                    render={() => (
                        <FormItem>
                            <FormLabel>Dias da Semana</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {weekDays.map((day) => (
                                    <FormField
                                        key={day}
                                        control={form.control}
                                        name={`availabilityDays.${day}`}
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel className="cursor-pointer">{day}</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="availabilityStartTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horário de Início</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="availabilityEndTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horário de Fim</FormLabel>
                                <FormControl>
                                    <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </form>
        </Form>
        <Separator className="my-8" />
        <div>
            <h3 className="text-xl font-bold font-headline mb-4">Minhas Cidades de Atuação</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {agentData?.cities?.map((city) => (
                <Badge key={city} variant="secondary" className="text-base py-1 pl-3 pr-2">
                  {city}
                  <button onClick={() => handleRemoveCity(city)} className="ml-2 rounded-full hover:bg-destructive/80 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
               {agentData?.cities?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cidade adicionada ainda.</p>}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="Ex: São Paulo"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
              />
              <Button onClick={handleAddCity}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Essas cidades aparecerão como opção ao cadastrar um novo imóvel.</p>
        </div>
      </CardContent>
    </Card>
  );
}
