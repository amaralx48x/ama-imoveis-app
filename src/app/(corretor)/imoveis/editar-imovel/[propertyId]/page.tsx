
'use client';

import { useForm } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useContacts } from "@/firebase/hooks/useContacts";
import { doc, setDoc } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";
import ImageUpload from "@/components/image-upload";
import Image from "next/image";
import type { Agent, Property, Contact } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, X, Loader2, Pencil, User, Share2, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";


const propertyTypes = ["Apartamento", "Casa", "Chácara", "Galpão", "Sala", "Kitnet", "Terreno", "Lote", "Alto Padrão"];
const operationTypes = ["Venda", "Aluguel"];
const portals = [
  { id: 'zap', name: 'ZAP+ (ZAP, VivaReal, OLX)' },
  { id: 'imovelweb', name: 'Imovelweb' },
  { id: 'casamineira', name: 'Casa Mineira (Mercado Livre)' },
  { id: 'chavesnamao', name: 'Chaves na Mão' },
  { id: 'tecimob', name: 'Tecimob' },
];


const formSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres."),
  city: z.string().min(1, "A cidade é obrigatória."),
  neighborhood: z.string().min(2, "O bairro deve ter pelo menos 2 caracteres."),
  type: z.enum(propertyTypes as [string, ...string[]]),
  operation: z.enum(operationTypes as [string, ...string[]]),
  price: z.coerce.number().positive("O preço deve ser um número positivo."),
  condoFee: z.coerce.number().min(0).optional(),
  yearlyTax: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  garage: z.coerce.number().int().min(0),
  rooms: z.coerce.number().int().min(0),
  builtArea: z.coerce.number().positive("A área construída deve ser positiva."),
  totalArea: z.coerce.number().positive("A área total deve ser positiva."),
  ownerContactId: z.string().optional(),
  videoUrl: z.string().url("URL do vídeo inválida").optional().or(z.literal('')),
  portalPublish: z.object({
    zap: z.boolean().optional(),
    imovelweb: z.boolean().optional(),
    casamineira: z.boolean().optional(),
    chavesnamao: z.boolean().optional(),
    tecimob: z.boolean().optional(),
  }).optional(),
});

function EditFormSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
             <Skeleton className="h-10 w-1/2" />
              <div className="grid grid-cols-4 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    )
}

export default function EditarImovelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const propertyId = params.propertyId as string;

  const agentRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'agents', user.uid) : null), [firestore, user]);
  const { data: agentData } = useDoc<Agent>(agentRef);

  const propertyRef = useMemoFirebase(() => (firestore && user && propertyId ? doc(firestore, `agents/${user.uid}/properties`, propertyId) : null), [firestore, user, propertyId]);
  const { data: propertyData, isLoading: isPropertyLoading, mutate } = useDoc<Property>(propertyRef);
  
  const { contacts } = useContacts(user?.uid || null);
  const owners = useMemo(() => contacts.filter((c: Contact) => c.type === 'owner'), [contacts]);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      neighborhood: "",
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      rooms: 0,
      builtArea: 0,
      totalArea: 0,
      ownerContactId: '',
      portalPublish: {},
      videoUrl: '',
      condoFee: 0,
      yearlyTax: 0
    },
  });
  
  useEffect(() => {
    if (propertyData) {
      form.reset({
        ...propertyData,
        ownerContactId: propertyData.ownerContactId || '',
        portalPublish: propertyData.portalPublish || {},
        videoUrl: propertyData.videoUrl || '',
        condoFee: propertyData.condoFee || 0,
        yearlyTax: propertyData.yearlyTax || 0,
      });
      setImageUrls(propertyData.imageUrls || []);
    }
  }, [propertyData, form]);


  const handleUploadComplete = (url: string) => {
    setImageUrls(prev => [...prev, url]);
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  const handlePriceChange = (fieldName: 'price' | 'condoFee' | 'yearlyTax') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
        form.setValue(fieldName, 0);
        e.target.value = '';
        return;
    }
    const numberValue = Number(rawValue) / 100;
    form.setValue(fieldName, numberValue);
    
    // Format for display
    e.target.value = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!propertyRef || !user) {
        toast({
            title: "Erro de Autenticação",
            variant: "destructive"
        });
        return;
    }
    
    if (imageUrls.length === 0) {
      toast({
        title: "Nenhuma imagem enviada",
        description: "Por favor, adicione pelo menos uma imagem para o imóvel.",
        variant: "destructive"
      });
      return;
    }

    const portalPublishData = portals.reduce((acc, portal) => {
        acc[portal.id as keyof typeof acc] = values.portalPublish?.[portal.id as keyof typeof values.portalPublish] || false;
        return acc;
    }, {} as Record<string, boolean>);


    const updatedProperty = {
      ...propertyData,
      ...values,
      imageUrls: imageUrls,
      ownerContactId: values.ownerContactId === 'none' ? null : values.ownerContactId,
      portalPublish: portalPublishData,
    };
    
    try {
        await setDoc(propertyRef, updatedProperty, { merge: true });
        mutate();
        
        toast({
            title: "Imóvel Atualizado!",
            description: `${values.title} foi atualizado com sucesso.`,
        });
        router.push('/imoveis');
    } catch (error) {
        console.error("Erro ao atualizar imóvel:", error);
        toast({title: "Erro ao salvar", variant: "destructive"});
    }
  }

  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href="/imoveis">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Imóveis
            </Link>
        </Button>
        <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Pencil /> Editar Imóvel</CardTitle>
            <CardDescription>Altere os detalhes do imóvel <span className="font-semibold text-primary">{propertyData?.title || '...'}</span>.</CardDescription>
        </CardHeader>
        <CardContent>
            {isPropertyLoading ? <EditFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Título do Anúncio</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Casa Espaçosa com 3 Quartos em..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="operation"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Operação</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Venda ou Aluguel" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Venda">Venda</SelectItem>
                            <SelectItem value="Aluguel">Aluguel</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Imóvel</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {propertyTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione a cidade de atuação" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {agentData?.cities?.length ? 
                                    agentData.cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>) :
                                    <SelectItem value="none" disabled>Adicione cidades no seu perfil</SelectItem>
                                }
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Centro, Taquaral, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="ownerContactId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><User className="w-4 h-4"/> Proprietário (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o proprietário do imóvel" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {owners.map((owner: Contact) => (
                                <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormDescription>Associe um contato cadastrado a este imóvel. Você pode cadastrar novos proprietários na seção "Contatos".</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Preço (R$)</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="R$ 850.000,00" onChange={handlePriceChange('price')} defaultValue={field.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(field.value) : ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="condoFee" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Condomínio (R$)</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="R$ 500,00" onChange={handlePriceChange('condoFee')} defaultValue={field.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(field.value) : ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="yearlyTax" render={({ field }) => (
                        <FormItem>
                            <FormLabel>IPTU Anual (R$)</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="R$ 1.200,00" onChange={handlePriceChange('yearlyTax')} defaultValue={field.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(field.value) : ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>


                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Quartos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Banheiros</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="garage" render={({ field }) => (<FormItem><FormLabel>Vagas Garagem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rooms" render={({ field }) => (<FormItem><FormLabel>Cômodos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="builtArea" render={({ field }) => (<FormItem><FormLabel>Área Construída (m²)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="totalArea" render={({ field }) => (<FormItem><FormLabel>Área Total (m²)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrição Completa</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Descreva os detalhes do imóvel..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Separator />
                
                <FormField control={form.control} name="videoUrl" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><Video /> Vídeo do Imóvel (Opcional)</FormLabel>
                        <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
                        <FormDescription>Cole aqui a URL de um vídeo do YouTube ou Vimeo.</FormDescription>
                        <FormMessage />
                    </FormItem>
                 )} />

                <Separator />
                
                <FormField
                  control={form.control}
                  name="portalPublish"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-lg font-semibold flex items-center gap-2">
                          <Share2 /> Publicar em Portais
                        </FormLabel>
                        <FormDescription>
                          Selecione em quais portais imobiliários este imóvel deve ser anunciado.
                        </FormDescription>
                      </div>
                      <div className="space-y-3">
                        {portals.map((portal) => (
                            <FormField
                                key={portal.id}
                                control={form.control}
                                name={`portalPublish.${portal.id}` as any}
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-medium text-base w-full cursor-pointer">
                                    {portal.name}
                                    </FormLabel>
                                </FormItem>
                                )}
                            />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                 <Separator />
                
                <FormItem>
                <FormLabel>Imagens do Imóvel</FormLabel>
                <FormDescription>Para uma melhor apresentação, use imagens de alta resolução.</FormDescription>
                {user && (
                    <ImageUpload
                        onUploadComplete={handleUploadComplete}
                        currentImageUrl={imageUrls}
                        multiple
                        agentId={user.uid}
                        propertyId={propertyId}
                    />
                )}
                {imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {imageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                            <Image src={url} alt={`Imagem do imóvel ${index + 1}`} fill sizes="150px" className="object-cover" />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remover imagem"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    </div>
                )}
                </FormItem>
                
                 <Separator />

                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                  ) : "Salvar Alterações"}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
