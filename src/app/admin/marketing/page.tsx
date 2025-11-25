
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
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';
import type { MarketingContent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { MonitorPlay, Loader2, MessageCircle } from 'lucide-react';
import ImageUpload from '@/components/image-upload';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const marketingFormSchema = z.object({
  hero_media_url: z.string().url('URL inválida').optional().or(z.literal('')),
  hero_media_type: z.enum(['image', 'video']).optional(),
  feature_video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  feature_video_title: z.string().optional(),
  ctaImageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  section2_image: z.string().url('URL inválida').optional().or(z.literal('')),
  section3_image: z.string().url('URL inválida').optional().or(z.literal('')),
  section4_image1: z.string().url('URL inválida').optional().or(z.literal('')),
  section4_image2: z.string().url('URL inválida').optional().or(z.literal('')),
  section5_image1: z.string().url('URL inválida').optional().or(z.literal('')),
  section5_image2: z.string().url('URL inválida').optional().or(z.literal('')),
  section6_image: z.string().url('URL inválida').optional().or(z.literal('')),
  supportWhatsapp: z.string().optional(),
});


type ImageField = {
    name: keyof z.infer<typeof marketingFormSchema>;
    label: string;
    description: string;
}

const otherImageFields: ImageField[] = [
    { name: 'section2_image', label: 'Seção 2: Imagem do Painel', description: 'Tamanho recomendado: 1200x800' },
    { name: 'section3_image', label: 'Seção 3: Imagem do Site Público', description: 'Tamanho recomendado: 1200x800' },
    { name: 'section4_image1', label: 'Seção 4: Imagem Sobreposta 1', description: 'Tamanho recomendado: 600x400' },
    { name: 'section4_image2', label: 'Seção 4: Imagem Sobreposta 2', description: 'Tamanho recomendado: 600x400' },
    { name: 'section5_image1', label: 'Seção 5: Imagem Sobreposta 3', description: 'Tamanho recomendado: 600x400' },
    { name: 'section5_image2', label: 'Seção 5: Imagem Sobreposta 4', description: 'Tamanho recomendado: 600x400' },
    { name: 'section6_image', label: 'Seção 6: Imagem de SEO', description: 'Tamanho recomendado: 1200x630' },
];

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

    const marketingRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'marketing', 'content') : null),
        [firestore]
    );

    const { data: marketingData, isLoading, mutate } = useDoc<MarketingContent>(marketingRef);

    const form = useForm<z.infer<typeof marketingFormSchema>>({
        resolver: zodResolver(marketingFormSchema),
        defaultValues: {
            hero_media_type: 'image',
            feature_video_title: "Veja a Plataforma em Ação",
        },
    });

    useEffect(() => {
        if (marketingData) {
            form.reset(marketingData);
        }
    }, [marketingData, form]);
    
    const handleUploadComplete = (fieldName: keyof z.infer<typeof marketingFormSchema>) => (url: string) => {
        form.setValue(fieldName, url, { shouldDirty: true });
    };

    async function onSubmit(values: z.infer<typeof marketingFormSchema>) {
        if (!marketingRef) return;
        
        try {
            await setDoc(marketingRef, values, { merge: true });
            mutate();
            toast({
                title: 'Conteúdo Atualizado!',
                description: 'As mídias da página de marketing foram salvas.',
            });
        } catch (error) {
            console.error("Erro ao salvar conteúdo de marketing:", error);
            toast({title: "Erro ao salvar", variant: "destructive"});
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><MonitorPlay/> Gerenciar Página de Marketing</CardTitle>
                <CardDescription>Altere as imagens e vídeos exibidos na página inicial do site. As alterações são aplicadas após salvar.</CardDescription>
                </CardHeader>
            </Card>

            {isLoading ? <MarketingFormSkeleton /> : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MessageCircle /> Suporte Prioritário</CardTitle>
                            <CardDescription>Configure o número de WhatsApp para o suporte prioritário do plano AMA ULTRA.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <FormField
                                control={form.control}
                                name="supportWhatsapp"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Número de WhatsApp para Suporte</FormLabel>
                                    <FormControl>
                                        <Input placeholder="5511999999999" {...field} />
                                    </FormControl>
                                    <FormDescription>Insira apenas números, incluindo o código do país (ex: 55 para o Brasil).</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Seção de Herói</CardTitle>
                            <CardDescription>A mídia principal que aparece no topo da página.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                           <FormField
                                control={form.control}
                                name="hero_media_type"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Tipo de Mídia</FormLabel>
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex space-x-2"
                                    >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="image" /></FormControl>
                                            <FormLabel className="font-normal">Imagem</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="video" /></FormControl>
                                            <FormLabel className="font-normal">Vídeo</FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                name="hero_media_url"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Upload da Mídia do Herói</FormLabel>
                                        <FormDescription>Envie um vídeo (.mp4) ou imagem.</FormDescription>
                                        <FormControl>
                                            <ImageUpload
                                                onUploadComplete={handleUploadComplete('hero_media_url')}
                                                currentImageUrl={field.value}
                                                agentId="marketing"
                                                propertyId="hero_media"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Seção "Call to Action"</CardTitle>
                            <CardDescription>Imagem que aparece ao lado do botão "Clique aqui".</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField
                                name="ctaImageUrl"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Upload da Imagem</FormLabel>
                                        <FormDescription>Envie uma imagem com fundo transparente (.png) para melhor resultado. Tamanho recomendado: 300x300</FormDescription>
                                        <FormControl>
                                            <ImageUpload
                                                onUploadComplete={handleUploadComplete('ctaImageUrl')}
                                                currentImageUrl={field.value}
                                                agentId="marketing"
                                                propertyId="cta_image"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader>
                            <CardTitle>Seção de Vídeo de Features</CardTitle>
                             <CardDescription>Vídeo que demonstra as funcionalidades da plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                name="feature_video_url"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Upload do Vídeo de Features</FormLabel>
                                        <FormDescription>Envie um vídeo no formato .mp4.</FormDescription>
                                        <FormControl>
                                            <ImageUpload
                                                onUploadComplete={handleUploadComplete('feature_video_url')}
                                                currentImageUrl={field.value}
                                                agentId="marketing"
                                                propertyId="feature_video"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                             <FormField
                                name="feature_video_title"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título da Seção do Vídeo</FormLabel>
                                        <FormDescription>Este título aparecerá sobre o vídeo.</FormDescription>
                                        <FormControl>
                                            <Input {...field} placeholder="Ex: Veja a Plataforma em Ação"/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                             />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Demais Seções</CardTitle>
                             <CardDescription>Imagens para as outras seções da página de marketing.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {otherImageFields.map(fieldInfo => (
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
