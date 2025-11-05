
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useEffect, useState } from 'react';
import type { MarketingContent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { MonitorPlay, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Separator } from '@/components/ui/separator';

type ImageField = {
    name: keyof MarketingContent;
    label: string;
    description: string;
}

const imageFields: ImageField[] = [
    { name: 'section1_image', label: 'Seção 1: Imagem Principal', description: 'Tamanho recomendado: 900x600' },
    { name: 'section2_image', label: 'Seção 2: Imagem do Painel', description: 'Tamanho recomendado: 1200x800' },
    { name: 'section3_image', label: 'Seção 3: Imagem do Site Público', description: 'Tamanho recomendado: 1200x800' },
    { name: 'section4_image1', label: 'Seção 4: Imagem Sobreposta 1', description: 'Tamanho recomendado: 600x400' },
    { name: 'section4_image2', label: 'Seção 4: Imagem Sobreposta 2', description: 'Tamanho recomendado: 600x400' },
    { name: 'section5_image1', label: 'Seção 5: Imagem Sobreposta 3', description: 'Tamanho recomendado: 600x400' },
    { name: 'section5_image2', label: 'Seção 5: Imagem Sobreposta 4', description: 'Tamanho recomendado: 600x400' },
];

const formSchemaDefinition = imageFields.reduce((acc, field) => {
    acc[field.name] = z.string().url('URL inválida').optional().or(z.literal(''));
    return acc;
}, {} as Record<keyof MarketingContent, z.ZodType<any, any>>);

const marketingFormSchema = z.object(formSchemaDefinition);


function MarketingFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}


export default function MarketingAdminPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const marketingRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'marketing', 'content') : null),
        [firestore]
    );

    const { data: marketingData, isLoading, mutate } = useDoc<MarketingContent>(marketingRef);

    const form = useForm<z.infer<typeof marketingFormSchema>>({
        resolver: zodResolver(marketingFormSchema),
        defaultValues: {},
    });

    useEffect(() => {
        if (marketingData) {
            form.reset(marketingData);
        }
    }, [marketingData, form]);
    
    const handleUploadComplete = (fieldName: keyof MarketingContent) => (url: string) => {
        form.setValue(fieldName, url, { shouldDirty: true });
    };

    async function onSubmit(values: z.infer<typeof marketingFormSchema>) {
        if (!marketingRef) return;
        
        setDocumentNonBlocking(marketingRef, values, { merge: true });
        mutate();
        toast({
            title: 'Conteúdo Atualizado!',
            description: 'As imagens da página de marketing foram salvas.',
        });
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><MonitorPlay/> Gerenciar Página de Marketing</CardTitle>
                <CardDescription>Altere as imagens exibidas na página inicial do site. As alterações são aplicadas após salvar.</CardDescription>
                </CardHeader>
            </Card>

            {isLoading ? <MarketingFormSkeleton /> : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {imageFields.map(fieldInfo => (
                             <FormField
                                key={fieldInfo.name}
                                control={form.control}
                                name={fieldInfo.name}
                                render={({ field }) => (
                                <FormItem className="p-4 border rounded-lg space-y-4">
                                    <div>
                                        <FormLabel className="text-lg">{fieldInfo.label}</FormLabel>
                                        <FormDescription>{fieldInfo.description}</FormDescription>
                                    </div>
                                    <FormControl>
                                       <ImageUpload
                                            onUploadComplete={handleUploadComplete(fieldInfo.name)}
                                            currentImageUrl={field.value}
                                            agentId="marketing" // Use a dedicated folder
                                            propertyId={fieldInfo.name} // Use field name for uniqueness
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        ))}
                        </CardContent>
                        <CardHeader>
                             <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                                {form.formState.isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                                ) : "Salvar Alterações"}
                            </Button>
                        </CardHeader>
                    </Card>
                </form>
                </Form>
            )}
        </div>
    )
}
