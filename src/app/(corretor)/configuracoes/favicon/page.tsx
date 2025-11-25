
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import Image from 'next/image';
import { InfoCard } from '@/components/info-card';

const faviconFormSchema = z.object({
  faviconUrl: z.string().url("URL do favicon inválida.").or(z.literal('')),
});

function FaviconFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-md" />
                <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function FaviconPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof faviconFormSchema>>({
    resolver: zodResolver(faviconFormSchema),
    defaultValues: {
      faviconUrl: '',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.faviconUrl) {
      form.reset({
        faviconUrl: agentData.siteSettings.faviconUrl,
      });
    }
  }, [agentData, form]);

  const handleUploadComplete = (url: string) => {
    form.setValue('faviconUrl', url, { shouldDirty: true });
  };

  async function onSubmit(values: z.infer<typeof faviconFormSchema>) {
    if (!agentRef) return;
    
    try {
        await setDoc(agentRef, { siteSettings: { faviconUrl: values.faviconUrl } }, { merge: true });
        mutate();

        toast({
            title: 'Favicon Salvo!',
            description: 'O ícone do seu site público foi atualizado.',
        });
    } catch (error) {
        console.error("Erro ao salvar o favicon:", error);
        toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar o ícone do site.',
            variant: 'destructive'
        });
    }
  }

  const currentFavicon = form.watch('faviconUrl');

  return (
    <div className="space-y-6">
        <InfoCard cardId="favicon-info" title="Ícone do Site (Favicon)">
            <p>
                O favicon é o pequeno ícone que aparece na aba do navegador, ao lado do título da sua página. Ele ajuda a identificar seu site e a passar uma imagem mais profissional.
            </p>
            <p>
                Envie uma imagem quadrada (como .png, .jpg ou .ico) para melhores resultados. Após salvar, o novo ícone será aplicado ao seu site público e também será visível no seu painel.
            </p>
        </InfoCard>

        <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <ImageIcon /> Favicon do Site
            </CardTitle>
            <CardDescription>
            Envie uma imagem para ser usada como o ícone (favicon) do seu site, que aparece na aba do navegador. Recomenda-se uma imagem quadrada (ex: .png, .ico).
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isAgentLoading ? <FaviconFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="faviconUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-lg font-semibold">Upload da Imagem</FormLabel>
                    <FormControl>
                        <ImageUpload
                        onUploadComplete={handleUploadComplete}
                        currentImageUrl={field.value}
                        agentId={user?.uid || 'unknown'}
                        propertyId="favicon" // Unique ID for this upload purpose
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {currentFavicon && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Preview do Favicon:</p>
                        <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
                            <Image src={currentFavicon} alt="Preview do Favicon" width={32} height={32} className="rounded-md"/>
                            <span className="text-muted-foreground">O ícone aparecerá na aba do navegador.</span>
                        </div>
                    </div>
                )}

                <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                ) : 'Salvar Favicon'}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
