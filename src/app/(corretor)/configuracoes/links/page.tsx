
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
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, Facebook, Instagram, Linkedin, Loader2 } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);


const linksFormSchema = z.object({
  whatsapp: z.string().optional(),
  instagram: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  facebook: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  linkedin: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
});

function LinksFormSkeleton() {
    return (
        <div className="space-y-8">
            {[...Array(4)].map((_, i) => (
                 <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function LinksPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof linksFormSchema>>({
    resolver: zodResolver(linksFormSchema),
    defaultValues: {
      whatsapp: '',
      instagram: '',
      facebook: '',
      linkedin: '',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.socialLinks) {
      form.reset({
        whatsapp: agentData.siteSettings.socialLinks.whatsapp || '',
        instagram: agentData.siteSettings.socialLinks.instagram || '',
        facebook: agentData.siteSettings.socialLinks.facebook || '',
        linkedin: agentData.siteSettings.socialLinks.linkedin || '',
      });
    }
  }, [agentData, form]);

  async function onSubmit(values: z.infer<typeof linksFormSchema>) {
    if (!agentRef) return;
    
    const settingsToUpdate = {
        'siteSettings.socialLinks': values,
    };

    setDocumentNonBlocking(agentRef, settingsToUpdate, { merge: true });

    toast({
        title: 'Links Atualizados!',
        description: 'Seus links de redes sociais foram salvos.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
          <Link /> Links e Redes Sociais
        </CardTitle>
        <CardDescription>
          Gerencie os links que aparecerão no cabeçalho e rodapé do seu site público.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isAgentLoading ? <LinksFormSkeleton /> : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp</FormLabel>
                   <FormControl>
                    <div className="relative">
                      <Input type="tel" placeholder="5511999999999" {...field} />
                      <WhatsAppIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormDescription>Número de telefone para contato via WhatsApp (apenas números).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Input type="url" placeholder="https://instagram.com/seu_usuario" {...field} />
                        <Instagram className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormDescription>Link completo para o seu perfil do Instagram.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Input type="url" placeholder="https://facebook.com/sua_pagina" {...field} />
                        <Facebook className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormDescription>Link completo para a sua página do Facebook.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Input type="url" placeholder="https://linkedin.com/in/seu_perfil" {...field} />
                        <Linkedin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormDescription>Link completo para o seu perfil do LinkedIn.</FormDescription>
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
              ) : 'Salvar Links'}
            </Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
