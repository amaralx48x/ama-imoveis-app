
'use client';

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import ImageUpload from "@/components/image-upload";
import type { CatalogPage } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Image as ImageIcon, Video, Star, Map, Users, Info, Settings, GalleryHorizontal, LayoutTemplate, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const detailSchema = z.object({ label: z.string().min(1), value: z.string().min(1) });
const differentialSchema = z.object({ label: z.string().min(1), icon: z.string().optional() });
const testimonialSchema = z.object({ author: z.string().min(1), text: z.string().min(1) });

const formSchema = z.object({
  name: z.string().min(3, "O nome da página é obrigatório."),
  heroImageUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  title: z.string().min(5, "O título principal é obrigatório."),
  subtitle: z.string().optional(),
  ctaButtonText: z.string().optional(),
  technicalDetails: z.array(detailSchema).optional(),
  galleryImages: z.array(z.string().url()).optional(),
  plantImages: z.array(z.string().url()).optional(),
  videoUrl: z.string().url("URL inválida.").optional().or(z.literal('')),
  fullDescription: z.string().optional(),
  differentials: z.array(differentialSchema).optional(),
  mapLocationQuery: z.string().optional(),
  socialProofText: z.string().optional(),
  testimonials: z.array(testimonialSchema).optional(),
});


function EditCatalogPageSkeleton() {
    return <Skeleton className="h-96 w-full" />
}

export default function EditarCatalogoPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const catalogPageId = params.catalogPageId as string;

  const pageRef = useMemoFirebase(() => (firestore && user && catalogPageId ? doc(firestore, `agents/${user.uid}/catalogPages`, catalogPageId) : null), [firestore, user, catalogPageId]);
  const { data: pageData, isLoading, mutate } = useDoc<CatalogPage>(pageRef);
  
  const [filesToUpload, setFilesToUpload] = useState<Record<string, File[]>>({});
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      title: '',
      technicalDetails: [],
      galleryImages: [],
      plantImages: [],
      differentials: [],
      testimonials: [],
    },
  });
  
  const { fields: techDetailsFields, append: appendTechDetail, remove: removeTechDetail } = useFieldArray({ control: form.control, name: "technicalDetails" });
  const { fields: diffFields, append: appendDiff, remove: removeDiff } = useFieldArray({ control: form.control, name: "differentials" });
  const { fields: testFields, append: appendTest, remove: removeTest } = useFieldArray({ control: form.control, name: "testimonials" });

  useEffect(() => {
    if (pageData) {
      form.reset({
        name: pageData.name || '',
        heroImageUrl: pageData.heroImageUrl || '',
        title: pageData.title || '',
        subtitle: pageData.subtitle || '',
        ctaButtonText: pageData.ctaButtonText || 'Falar com um Corretor',
        technicalDetails: pageData.technicalDetails || [],
        galleryImages: pageData.galleryImages || [],
        plantImages: pageData.plantImages || [],
        videoUrl: pageData.videoUrl || '',
        fullDescription: pageData.fullDescription || '',
        differentials: pageData.differentials || [],
        mapLocationQuery: pageData.mapLocationQuery || '',
        socialProofText: pageData.socialProofText || '',
        testimonials: pageData.testimonials || [],
      });
    }
  }, [pageData, form]);

  const handleFileSelect = (fieldName: string) => (files: File[]) => {
    setFilesToUpload(prev => ({...prev, [fieldName]: files }));
  }

  const uploadFiles = async (files: File[], path: string): Promise<string[]> => {
    if (!user) return [];
    const storage = getStorage();
    const uploadPromises = files.map(async file => {
        const filePath = `agents/${user.uid}/catalogPages/${catalogPageId}/${path}/${uuidv4()}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    });
    return Promise.all(uploadPromises);
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!pageRef) return;
    setIsUploading(true);

    try {
      const heroImageFile = filesToUpload['heroImageUrl']?.[0];
      if (heroImageFile) {
        values.heroImageUrl = (await uploadFiles([heroImageFile], 'hero'))[0];
      }
      
      const galleryFiles = filesToUpload['galleryImages'];
      if (galleryFiles?.length) {
        const newUrls = await uploadFiles(galleryFiles, 'gallery');
        values.galleryImages = [...(values.galleryImages || []), ...newUrls];
      }
      
      const plantFiles = filesToUpload['plantImages'];
      if (plantFiles?.length) {
        const newUrls = await uploadFiles(plantFiles, 'plants');
        values.plantImages = [...(values.plantImages || []), ...newUrls];
      }

      await setDoc(pageRef, values, { merge: true });
      mutate();
      setFilesToUpload({});
      toast({ title: "Página de Catálogo Salva!" });
      router.push('/configuracoes/sites-extras');
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href="/configuracoes/sites-extras">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Sites Extras
            </Link>
        </Button>
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                <LayoutTemplate/> Editar "{pageData?.name || 'Página'}"
                </CardTitle>
                <CardDescription>Preencha os campos abaixo para construir sua landing page.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <EditCatalogPageSkeleton/> : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                            {/* Seção Hero */}
                            <div className="space-y-6 p-4 border rounded-lg">
                                <h3 className="text-xl font-bold flex items-center gap-2"><ImageIcon/> Seção Principal (Hero)</h3>
                                <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título Principal</FormLabel><FormControl><Input {...field} placeholder="Residencial Vista do Vale"/></FormControl><FormMessage/></FormItem> )}/>
                                <FormField control={form.control} name="subtitle" render={({ field }) => ( <FormItem><FormLabel>Frase de Valor (Subtítulo)</FormLabel><FormControl><Input {...field} placeholder="Lotes a partir de 250m²"/></FormControl><FormMessage/></FormItem> )}/>
                                <FormField control={form.control} name="ctaButtonText" render={({ field }) => ( <FormItem><FormLabel>Texto do Botão de Ação</FormLabel><FormControl><Input {...field} placeholder="Falar com um Corretor"/></FormControl><FormMessage/></FormItem> )}/>
                                <FormItem><FormLabel>Imagem de Fundo</FormLabel><FormControl><ImageUpload onFileSelect={handleFileSelect('heroImageUrl')} /></FormControl></FormItem>
                            </div>
                            
                             {/* Detalhes Técnicos */}
                            <div className="space-y-6 p-4 border rounded-lg">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Info/> Informações Essenciais (Ficha Técnica)</h3>
                                {techDetailsFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-end p-2 border-b">
                                        <FormField control={form.control} name={`technicalDetails.${index}.label`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Rótulo</FormLabel><FormControl><Input {...field} placeholder="Ex: Tipo"/></FormControl><FormMessage/></FormItem> )}/>
                                        <FormField control={form.control} name={`technicalDetails.${index}.value`} render={({ field }) => ( <FormItem className="flex-1"><FormLabel>Valor</FormLabel><FormControl><Input {...field} placeholder="Ex: Loteamento"/></FormControl><FormMessage/></FormItem> )}/>
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeTechDetail(index)}><Trash2/></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendTechDetail({ label: '', value: '' })}><Plus className="mr-2"/>Adicionar Detalhe</Button>
                            </div>

                            {/* Galerias e Mídia */}
                            <div className="space-y-6 p-4 border rounded-lg">
                                <h3 className="text-xl font-bold flex items-center gap-2"><GalleryHorizontal/> Galerias e Mídia</h3>
                                <FormItem><FormLabel>Galeria de Imagens</FormLabel><FormControl><ImageUpload onFileSelect={handleFileSelect('galleryImages')} multiple /></FormControl></FormItem>
                                <FormItem><FormLabel>Imagens das Plantas</FormLabel><FormControl><ImageUpload onFileSelect={handleFileSelect('plantImages')} multiple /></FormControl></FormItem>
                                <FormField control={form.control} name="videoUrl" render={({ field }) => ( <FormItem><FormLabel>URL do Vídeo</FormLabel><FormControl><Input {...field} placeholder="https://youtube.com/watch?v=..."/></FormControl><FormMessage/></FormItem> )}/>
                            </div>

                            {/* Conteúdo Descritivo */}
                             <div className="space-y-6 p-4 border rounded-lg">
                                <h3 className="text-xl font-bold flex items-center gap-2"><MessageSquare/> Conteúdo e Diferenciais</h3>
                                <FormField control={form.control} name="fullDescription" render={({ field }) => ( <FormItem><FormLabel>Descrição Completa</FormLabel><FormControl><Textarea {...field} placeholder="Descreva o empreendimento em detalhes..." className="min-h-32" /></FormControl><FormMessage/></FormItem> )}/>
                                
                                <div className="space-y-2">
                                  <FormLabel>Diferenciais</FormLabel>
                                  {diffFields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center p-2 border-b">
                                      <FormField control={form.control} name={`differentials.${index}.label`} render={({ field }) => ( <FormItem className="flex-1"><FormControl><Input {...field} placeholder="Ex: Portaria 24h"/></FormControl><FormMessage/></FormItem> )}/>
                                      <Button type="button" variant="destructive" size="icon" onClick={() => removeDiff(index)}><Trash2/></Button>
                                    </div>
                                  ))}
                                  <Button type="button" variant="outline" onClick={() => appendDiff({ label: ''})}><Plus className="mr-2"/>Adicionar Diferencial</Button>
                                </div>
                            </div>

                            {/* Localização e Prova Social */}
                             <div className="space-y-6 p-4 border rounded-lg">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Map/> Localização e Prova Social</h3>
                                <FormField control={form.control} name="mapLocationQuery" render={({ field }) => ( <FormItem><FormLabel>Endereço para o Mapa</FormLabel><FormControl><Input {...field} placeholder="Rua Exemplo, 123, Cidade, Estado"/></FormControl><FormMessage/></FormItem> )}/>
                                <FormField control={form.control} name="socialProofText" render={({ field }) => ( <FormItem><FormLabel>Texto de Prova Social</FormLabel><FormControl><Input {...field} placeholder="Ex: Mais de 80% vendido!"/></FormControl><FormMessage/></FormItem> )}/>
                                <div className="space-y-2">
                                  <FormLabel>Depoimentos</FormLabel>
                                  {testFields.map((field, index) => (
                                    <div key={field.id} className="flex flex-col gap-2 p-3 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold">Depoimento #{index + 1}</h4>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTest(index)} className="text-destructive"><Trash2/></Button>
                                        </div>
                                      <FormField control={form.control} name={`testimonials.${index}.author`} render={({ field }) => ( <FormItem><FormLabel>Autor</FormLabel><FormControl><Input {...field} placeholder="João S."/></FormControl><FormMessage/></FormItem> )}/>
                                      <FormField control={form.control} name={`testimonials.${index}.text`} render={({ field }) => ( <FormItem><FormLabel>Texto</FormLabel><FormControl><Textarea {...field} placeholder="Adorei o projeto..."/></FormControl><FormMessage/></FormItem> )}/>
                                    </div>
                                  ))}
                                  <Button type="button" variant="outline" onClick={() => appendTest({ author: '', text: '' })}><Plus className="mr-2"/>Adicionar Depoimento</Button>
                                </div>
                            </div>

                            <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={isUploading}>
                                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : "Salvar Página"}
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

