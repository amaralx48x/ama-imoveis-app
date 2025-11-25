
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
import { useEffect } from 'react';
import type { Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Palette, Sun, Moon, Loader2, Image as ImageIcon, View } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { InfoCard } from '@/components/info-card';
import ImageUpload from '@/components/image-upload';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';

const appearanceFormSchema = z.object({
  theme: z.enum(['light', 'dark'], { required_error: 'Por favor, selecione um tema.' }),
  heroImageUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal('')),
  propertiesPerSection: z.coerce.number().min(3).max(8).default(4),
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

  const form = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: 'dark',
      heroImageUrl: '',
      logoUrl: '',
      propertiesPerSection: 4,
    },
  });

  useEffect(() => {
    if (agentData?.siteSettings) {
      form.reset({
        theme: agentData.siteSettings.theme || 'dark',
        heroImageUrl: agentData.siteSettings.heroImageUrl || '',
        logoUrl: agentData.siteSettings.logoUrl || '',
        propertiesPerSection: agentData.siteSettings.propertiesPerSection || 4,
      });
    }
  }, [agentData, form]);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    form.setValue('theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  };
  
  const handleHeroUploadComplete = (url: string) => {
    form.setValue('heroImageUrl', url, { shouldDirty: true });
  }
  
  const handleLogoUploadComplete = (url: string) => {
    form.setValue('logoUrl', url, { shouldDirty: true });
  }

  async function onSubmit(values: z.infer<typeof appearanceFormSchema>) {
    if (!agentRef) return;

    const currentSettings = agentData?.siteSettings || {};
    
    const newSettings = {
        ...currentSettings,
        ...values,
    };
    
    try {
        await setDoc(agentRef, { siteSettings: newSettings }, { merge: true });
        mutate();

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
    }
  }
  
  const currentHeroImage = form.watch('heroImageUrl');
  const currentLogo = form.watch('logoUrl');
  const propertiesPerSection = form.watch('propertiesPerSection');

  return (
    <div className="space-y-6">
        <InfoCard cardId="aparencia-info" title="Personalize a Aparência">
            <p>
                Escolha o tema de cores, a imagem de fundo e a densidade de imóveis nas seções do seu site. Suas seleções são aplicadas instantaneamente neste painel para você ter uma pré-visualização.
            </p>
            <p>
                Ao clicar em "Salvar", as mudanças serão aplicadas também no seu site público, garantindo uma experiência visual consistente para seus clientes.
            </p>
        </InfoCard>
        <Card>
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Palette /> Aparência
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

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold flex items-center gap-2">
                        <ImageIcon /> Logotipo do Site
                      </FormLabel>
                      <FormControl>
                          <ImageUpload
                            onUploadComplete={handleLogoUploadComplete}
                            currentImageUrl={field.value}
                            agentId={user?.uid || 'unknown'}
                            propertyId="logo"
                          />
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
                          <ImageUpload
                            onUploadComplete={handleHeroUploadComplete}
                            currentImageUrl={field.value}
                            agentId={user?.uid || 'unknown'}
                            propertyId="hero-image"
                          />
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
                                max={8}
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


                <Button type="submit" size="lg" disabled={form.formState.isSubmitting || !form.formState.isDirty} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                {form.formState.isSubmitting ? (
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

    