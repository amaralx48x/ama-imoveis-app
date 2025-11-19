
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
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import Image from 'next/image';
import { InfoCard } from '@/components/info-card';

const heroFormSchema = z.object({
  heroImageUrl: z.string().url("URL da imagem inválida.").or(z.literal('')),
});

function HeroFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function HeroImagePage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const form = useForm<z.infer<typeof heroFormSchema>>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: {
      heroImageUrl: '',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.heroImageUrl) {
      form.reset({
        heroImageUrl: agentData.siteSettings.heroImageUrl,
      });
    }
  }, [agentData, form]);

  const handleUploadComplete = (url: string) => {
    form.setValue('heroImageUrl', url, { shouldDirty: true });
  };

  async function onSubmit(values: z.infer<typeof heroFormSchema>) {
    if (!agentRef) return;
    
    try {
        await setDoc(agentRef, { siteSettings: { heroImageUrl: values.heroImageUrl } }, { merge: true });
        mutate();

        toast({
            title: 'Imagem de Capa Salva!',
            description: 'A imagem principal do seu site público foi atualizada.',
        });
    } catch (error) {
        console.error("Erro ao salvar a imagem de capa:", error);
        toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar a imagem de capa.',
            variant: 'destructive'
        });
    }
  }

  const currentHeroImage = form.watch('heroImageUrl');

  return (
    <div className="space-y-6">
        <InfoCard cardId="hero-info" title="Imagem de Capa do Site">
            <p>
                Esta é a imagem principal que seus visitantes verão ao acessar seu site. Uma boa imagem de capa causa uma ótima primeira impressão.
            </p>
            <p>
                Envie uma imagem de alta qualidade e em formato paisagem (horizontal) para melhores resultados, como a foto de uma bela fachada ou uma paisagem da sua cidade. Tamanho recomendado: 1920x1080 pixels.
            </p>
        </InfoCard>

        <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <ImageIcon /> Imagem de Capa (Hero)
            </CardTitle>
            <CardDescription>
            Envie uma imagem para ser usada como o banner principal do seu site público.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isAgentLoading ? <HeroFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="heroImageUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-lg font-semibold">Upload da Imagem</FormLabel>
                    <FormControl>
                        <ImageUpload
                        onUploadComplete={handleUploadComplete}
                        currentImageUrl={field.value}
                        agentId={user?.uid || 'unknown'}
                        propertyId="hero-image"
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {currentHeroImage && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Preview da Imagem:</p>
                        <div className="relative aspect-video w-full rounded-md border bg-muted/50 overflow-hidden">
                            <Image src={currentHeroImage} alt="Preview da Imagem de Capa" layout="fill" objectFit="cover" />
                        </div>
                    </div>
                )}

                <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                ) : 'Salvar Imagem de Capa'}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
