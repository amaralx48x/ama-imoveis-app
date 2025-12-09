
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
import { Loader2, Image as ImageIcon, Droplet } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import Image from 'next/image';
import { InfoCard } from '@/components/info-card';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const watermarkFormSchema = z.object({
  watermarkUrl: z.string().url("URL da marca d'água inválida.").or(z.literal('')),
});

function WatermarkFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className='space-y-2'>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function WatermarkPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof watermarkFormSchema>>({
    resolver: zodResolver(watermarkFormSchema),
    defaultValues: {
      watermarkUrl: '',
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings?.watermarkUrl) {
      form.reset({
        watermarkUrl: agentData.siteSettings.watermarkUrl,
      });
    }
  }, [agentData, form]);

  async function onSubmit(values: z.infer<typeof watermarkFormSchema>) {
    if (!agentRef || !user) return;
    setIsUploading(true);
    
    let watermarkUrl = values.watermarkUrl;

    try {
        if (watermarkFile) {
            const storage = getStorage();
            const filePath = `agents/${user.uid}/site-assets/watermark`;
            const fileRef = ref(storage, filePath);
            await uploadBytes(fileRef, watermarkFile);
            watermarkUrl = await getDownloadURL(fileRef);
        }

        await setDoc(agentRef, { siteSettings: { watermarkUrl: watermarkUrl } }, { merge: true });
        mutate();
        setWatermarkFile(null);

        toast({
            title: 'Marca d\'água Salva!',
            description: 'A imagem foi salva com sucesso.',
        });
    } catch (error) {
        console.error("Erro ao salvar a marca d'água:", error);
        toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar a imagem.',
            variant: 'destructive'
        });
    } finally {
        setIsUploading(false);
    }
  }

  const currentWatermark = form.watch('watermarkUrl');
  const previewImage = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGhvdXNlfGVufDB8fDB8fHww";

  return (
    <div className="space-y-6">
        <InfoCard cardId="watermark-info" title="Proteja suas Fotos">
            <p>
                A marca d'água é uma imagem (geralmente seu logotipo) que é aplicada sobre as fotos dos seus imóveis. Isso ajuda a proteger suas imagens contra uso não autorizado e a reforçar sua marca.
            </p>
            <p>
                Envie uma imagem com fundo transparente (formato .png) para melhores resultados. A aplicação visual da marca d'água nas fotos é um processo automático que será implementado em breve.
            </p>
        </InfoCard>

        <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Droplet /> Marca D'água
            </CardTitle>
            <CardDescription>
            Envie o logotipo ou imagem que será usado como marca d'água nas fotos dos seus imóveis no site público.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isAgentLoading ? <WatermarkFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="watermarkUrl"
                render={() => (
                    <FormItem>
                    <FormLabel className="text-lg font-semibold">Upload da Imagem</FormLabel>
                    <FormControl>
                        <ImageUpload onFileSelect={(files) => setWatermarkFile(files[0])} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {currentWatermark && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium">Pré-visualização:</p>
                        <div className="relative aspect-video w-full max-w-lg rounded-md overflow-hidden border">
                            <Image src={previewImage} alt="Imagem de exemplo para preview da marca d'água" layout="fill" objectFit="cover" />
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <Image src={currentWatermark} alt="Preview da Marca d'água" width={128} height={128} className="opacity-50"/>
                            </div>
                        </div>
                         <p className="text-xs text-muted-foreground">Esta é apenas uma demonstração. A posição e tamanho final podem variar.</p>
                    </div>
                )}

                <Button type="submit" size="lg" disabled={isUploading || (!form.formState.isDirty && !watermarkFile)} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {isUploading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                ) : 'Salvar Marca d\'água'}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
