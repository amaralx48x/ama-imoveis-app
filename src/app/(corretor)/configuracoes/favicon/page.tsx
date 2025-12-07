
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
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  async function onSubmit(values: z.infer<typeof faviconFormSchema>) {
    if (!agentRef || !user) return;
    setIsUploading(true);
    
    let faviconUrl = values.faviconUrl;

    try {
        if (faviconFile) {
            const storage = getStorage();
            const filePath = `agents/${user.uid}/site-assets/favicon`;
            const fileRef = ref(storage, filePath);
            await uploadBytes(fileRef, faviconFile);
            faviconUrl = await getDownloadURL(fileRef);
        }

        await setDoc(agentRef, { siteSettings: { faviconUrl: faviconUrl } }, { merge: true });
        mutate();
        setFaviconFile(null);

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
    } finally {
        setIsUploading(false);
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
                render={() => (
                    <FormItem>
                    <FormLabel className="text-lg font-semibold">Upload da Imagem</FormLabel>
                    <FormControl>
                        <ImageUpload onFileSelect={(files) => setFaviconFile(files[0])} />
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

                <Button type="submit" size="lg" disabled={isUploading || (!form.formState.isDirty && !faviconFile)} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {isUploading ? (
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
