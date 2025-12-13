
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Sun, Moon, Loader2, Image as ImageIcon, View, MessageSquare } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { InfoCard } from '@/components/info-card';
import ImageUpload from '@/components/image-upload';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark'], { required_error: 'Por favor, selecione um tema.' }),
  heroHeadline: z.string().optional(),
  heroSubtext: z.string().optional(),
  heroImageUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  faviconUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  propertiesPerSection: z.coerce.number().min(3).max(5).default(4),
});

function AppearanceFormSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <div className="flex gap-4">
                    <Skeleton className="h-24 w-32 rounded-md" />
                    <Skeleton className="h-24 w-32 rounded-md" />
                </div>
            </div>
            <Separator />
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <Separator />
             <div className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function AparenciaPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  
  const { data: agentData, isLoading: isAgentLoading, mutate } = useDoc<Agent>(agentRef);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: 'dark',
      heroHeadline: '',
      heroSubtext: '',
      heroImageUrl: '',
      logoUrl: '',
      faviconUrl: '',
      propertiesPerSection: 4,
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings) {
      form.reset({
        theme: agentData.siteSettings.theme || 'dark',
        heroHeadline: agentData.siteSettings.heroHeadline || '',
        heroSubtext: agentData.siteSettings.heroSubtext || '',
        heroImageUrl: agentData.siteSettings.heroImageUrl || '',
        logoUrl: agentData.siteSettings.logoUrl || '',
        faviconUrl: agentData.siteSettings.faviconUrl || '',
        propertiesPerSection: agentData.siteSettings.propertiesPerSection || 4,
      });
    }
  }, [agentData, form]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    form.setValue('theme', theme);
  };
  
  const uploadFile = async (file: File, path: string): Promise<string> => {
      const storage = getStorage();
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
  };

  async function onSubmit(values: z.infer<typeof appearanceFormSchema>) {
    if (!agentRef || !user) return;
    setIsUploading(true);
    
    let { logoUrl, heroImageUrl, faviconUrl } = values;

    try {
        if (logoFile) {
            logoUrl = await uploadFile(logoFile, `agents/${user.uid}/site-assets/logo`);
            form.setValue('logoUrl', logoUrl);
        }
        if (heroFile) {
            heroImageUrl = await uploadFile(heroFile, `agents/${user.uid}/site-assets/hero-image`);
            form.setValue('heroImageUrl', heroImageUrl);
        }
        if (faviconFile) {
            faviconUrl = await uploadFile(faviconFile, `agents/${user.uid}/site-assets/favicon`);
            form.setValue('faviconUrl', faviconUrl);
        }

        const newSettings = {
            ...agentData?.siteSettings,
            ...values,
            logoUrl,
            heroImageUrl,
            faviconUrl,
        };
    
        await setDoc(agentRef, { siteSettings: newSettings }, { merge: true });
        mutate();
        setLogoFile(null);
        setHeroFile(null);
        setFaviconFile(null);

        toast({
            title: 'Aparência Salva!',
            description: 'A aparência do seu site público foi atualizada com sucesso.',
        });
    } catch (error) {
        console.error("Erro ao salvar a aparência:", error);
        toast({
            title: 'Erro ao Salvar',
            description: 'Não foi possível atualizar a aparência.',
            variant: 'destructive'
        });
    } finally {
      setIsUploading(false);
    }
  }
  
  const currentHeroImage = form.watch('heroImageUrl');
  const currentLogo = form.watch('logoUrl');
  const currentFavicon = form.watch('faviconUrl');
  const propertiesPerSection = form.watch('propertiesPerSection');

  return (
    <div className="space-y-6">
        <InfoCard cardId="aparencia-info" title="Personalize a Aparência">
            <p>
                Escolha o tema de cores, imagens de fundo, logotipo e o ícone do seu site. Suas seleções são aplicadas instantaneamente neste painel para você ter uma pré-visualização.
            </p>
            <p>
                Ao clicar em "Salvar", as mudanças serão aplicadas também no seu site público.
            </p>
        </InfoCard>
        <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Palette /> Aparência do Site
            </CardTitle>
            <CardDescription>
            Personalize a aparência do seu site público e do painel de controle.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isAgentLoading ? <AppearanceFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel className="text-lg font-semibold">Tema de Cores</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={(value: 'light' | 'dark') => handleThemeChange(value)}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                        >
                        <FormItem>
                            <RadioGroupItem value="light" id="light" className="peer sr-only" />
                            <Label
                            htmlFor="light"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                            <Sun className="mb-3 h-6 w-6" />
                            Claro
                            </Label>
                        </FormItem>
                        <FormItem>
                            <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                            <Label
                            htmlFor="dark"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                            <Moon className="mb-3 h-6 w-6" />
                            Escuro
                            </Label>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormDescription>Selecione o tema para pré-visualizar. Clique em salvar para aplicar no site público.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <Separator />

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquare /> Mensagem de Boas-Vindas
                    </h3>
                    <FormField
                      control={form.control}
                      name="heroHeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chamada Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="Encontre o Imóvel dos Seus Sonhos" {...field} />
                          </FormControl>
                           <FormDescription>O título principal que aparece no topo do seu site.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="heroSubtext"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtítulo</FormLabel>
                          <FormControl>
                            <Textarea placeholder="As melhores oportunidades do mercado imobiliário para você." {...field} />
                          </FormControl>
                           <FormDescription>O texto de apoio que aparece abaixo do título principal.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <Separator />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2">
                        <ImageIcon /> Logotipo do Site
                      </FormLabel>
                      <FormControl>
                          <ImageUpload onFileSelect={(files) => setLogoFile(files[0])} />
                      </FormControl>
                       <FormDescription>Este é o logotipo que aparece no cabeçalho do site. Tamanho recomendado: 128x128 pixels. Use um formato com fundo transparente, como .png.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentLogo && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Pré-visualização do Logotipo:</p>
                        <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/50">
                            <Image src={currentLogo} alt="Preview do Logotipo" width={48} height={48} className="rounded-md"/>
                            <span className="font-bold text-lg">{agentData?.name || "Nome do Site"}</span>
                        </div>
                    </div>
                )}
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="heroImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2">
                        <ImageIcon /> Imagem de Fundo (Hero)
                      </FormLabel>
                      <FormControl>
                          <ImageUpload onFileSelect={(files) => setHeroFile(files[0])} />
                      </FormControl>
                       <FormDescription>Esta é a imagem principal que aparece no topo do seu site. Tamanho recomendado: 1920x1080 pixels.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentHeroImage && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Pré-visualização da Imagem Hero:</p>
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                            <Image src={currentHeroImage} alt="Preview da Imagem Hero" layout="fill" objectFit="cover" />
                        </div>
                    </div>
                )}
                
                <Separator />

                 <FormField
                  control={form.control}
                  name="faviconUrl"
                  render={() => (
                      <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2"><ImageIcon /> Favicon do Site</FormLabel>
                      <FormControl>
                          <ImageUpload onFileSelect={(files) => setFaviconFile(files[0])} />
                      </FormControl>
                      <FormDescription>Este é o ícone que aparece na aba do navegador. Recomenda-se uma imagem quadrada (ex: .png, .ico).</FormDescription>
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

                <Separator />

                <FormField
                  control={form.control}
                  name="propertiesPerSection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2">
                        <View /> Imóveis por Seção
                      </FormLabel>
                      <div className="flex items-center gap-4">
                        <FormControl>
                            <Slider
                                min={3}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="flex-1"
                            />
                        </FormControl>
                        <span className="font-bold text-lg w-10 text-center">{propertiesPerSection}</span>
                      </div>
                      <FormDescription>
                        Escolha quantos imóveis aparecerão por vez nas seções em carrossel do seu site público.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <Button type="submit" size="lg" disabled={isUploading || form.formState.isSubmitting || !form.formState.isDirty && !logoFile && !heroFile && !faviconFile} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {isUploading || form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                ) : 'Salvar Aparência'}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
