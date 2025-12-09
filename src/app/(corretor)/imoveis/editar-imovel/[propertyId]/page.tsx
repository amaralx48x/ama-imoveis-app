
'use client';

import { useForm, Controller } from "react-hook-form";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useParams } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useContacts } from "@/firebase/hooks/useContacts";
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useState, useEffect, useMemo, useCallback } from "react";
import ImageUpload from "@/components/image-upload";
import Image from "next/image";
import type { Agent, Property, Contact } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, X, Loader2, Pencil, User, Share2, Video, Sparkles, ChevronDown, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { generatePropertyDescription, GeneratePropertyDescriptionInput } from '@/ai/flows/generate-property-description-flow';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { usePlan } from '@/context/PlanContext';

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
  tenantContactId: z.string().optional(),
  videoUrl: z.string().url("URL do vídeo inválida").optional().or(z.literal('')),
  portalPublish: z.object({
    zap: z.boolean().optional(),
    imovelweb: z.boolean().optional(),
    casamineira: z.boolean().optional(),
    chavesnamao: z.boolean().optional(),
    tecimob: z.boolean().optional(),
  }).optional(),
  rentalDetails: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
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
  const { limits } = usePlan();
  
  const propertyId = params.propertyId as string;

  const agentRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'agents', user.uid) : null), [firestore, user]);
  const { data: agentData } = useDoc<Agent>(agentRef);

  const propertyRef = useMemoFirebase(() => (firestore && user && propertyId ? doc(firestore, `agents/${user.uid}/properties`, propertyId) : null), [firestore, user, propertyId]);
  const { data: propertyData, isLoading: isPropertyLoading, mutate } = useDoc<Property>(propertyRef);
  
  const { contacts } = useContacts(user?.uid || null);
  const owners = useMemo(() => contacts.filter((c: Contact) => c.type === 'owner'), [contacts]);
  const tenants = useMemo(() => contacts.filter((c: Contact) => c.type === 'inquilino'), [contacts]);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      city: undefined,
      neighborhood: "",
      price: 0,
      operation: undefined,
      type: undefined,
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      rooms: 0,
      builtArea: 0,
      totalArea: 0,
      ownerContactId: undefined,
      tenantContactId: undefined,
      portalPublish: {},
      videoUrl: '',
      condoFee: 0,
      yearlyTax: 0,
      rentalDetails: {
          startDate: undefined,
          endDate: undefined,
      }
    },
  });
  
  useEffect(() => {
    if (propertyData) {
      form.reset({
        ...propertyData,
        ownerContactId: propertyData.ownerContactId || undefined,
        tenantContactId: propertyData.tenantContactId || undefined,
        portalPublish: propertyData.portalPublish || {},
        videoUrl: propertyData.videoUrl || '',
        condoFee: propertyData.condoFee || 0,
        yearlyTax: propertyData.yearlyTax || 0,
        rentalDetails: {
            startDate: propertyData.rentalDetails?.startDate?.toDate ? propertyData.rentalDetails.startDate.toDate() : undefined,
            endDate: propertyData.rentalDetails?.endDate?.toDate ? propertyData.rentalDetails.endDate.toDate() : undefined,
        }
      });
      setImageUrls(propertyData.imageUrls || []);

      if (propertyData.condoFee || propertyData.yearlyTax || propertyData.videoUrl || (propertyData.portalPublish && Object.values(propertyData.portalPublish).some(v => v))) {
        setShowCompleteForm(true);
      }
    }
  }, [propertyData, form]);

    const handleGenerateDescription = async (style: 'short' | 'detailed') => {
        if (!limits.aiDescriptions) {
            toast({
                title: "Recurso indisponível",
                description: "A geração de descrição por IA não está inclusa no seu plano.",
                variant: "destructive"
            });
            return;
        }
        const values = form.getValues();
        
        const requiredFields: (keyof typeof values)[] = ['type', 'city', 'neighborhood', 'operation', 'price'];
        const missingFields = requiredFields.filter(field => !values[field]);

        if (missingFields.length > 0) {
            toast({
                title: "Informações insuficientes",
                description: `Preencha pelo menos: ${missingFields.join(', ')} para gerar uma descrição.`,
                variant: "destructive"
            });
            return;
        }
        
        setIsGeneratingDescription(true);
        try {
            const input: GeneratePropertyDescriptionInput = {
                style,
                type: values.type!,
                operation: values.operation!,
                city: values.city!,
                neighborhood: values.neighborhood,
                bedrooms: values.bedrooms,
                bathrooms: values.bathrooms,
                garage: values.garage,
                builtArea: values.builtArea,
                price: values.price
            };

            const result = await generatePropertyDescription(input);
            if (result?.description) {
                form.setValue('description', result.description, { shouldValidate: true, shouldDirty: true });
                toast({ title: "Descrição gerada com sucesso!" });
            } else {
                throw new Error("A descrição retornou vazia.");
            }
        } catch (error) {
            console.error("Erro ao gerar descrição:", error);
            toast({ title: "Erro na IA", description: "Não foi possível gerar a descrição.", variant: "destructive" });
        } finally {
            setIsGeneratingDescription(false);
        }
    };

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
    
    e.target.value = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue);
  }

  const uploadImages = useCallback(async (): Promise<string[]> => {
    if (filesToUpload.length === 0 || !user) return [];
    
    const storage = getStorage();
    const uploadPromises = filesToUpload.map(async (file) => {
        const filePath = `agents/${user.uid}/properties/${propertyId}/${uuidv4()}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    });

    return Promise.all(uploadPromises);
  }, [filesToUpload, user, propertyId]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!propertyRef || !user || !firestore) {
        toast({ title: "Erro de Autenticação", variant: "destructive" });
        return;
    }
    
    try {
        const newImageUrls = await uploadImages();
        const allImageUrls = [...imageUrls, ...newImageUrls];

        if (allImageUrls.length === 0) {
            toast({ title: "Nenhuma imagem enviada", description: "Adicione pelo menos uma imagem.", variant: "destructive" });
            return;
        }

        const portalPublishData = portals.reduce((acc, portal) => {
            acc[portal.id as keyof typeof acc] = values.portalPublish?.[portal.id as keyof typeof values.portalPublish] || false;
            return acc;
        }, {} as Record<string, boolean>);

        const newOwnerContactId = values.ownerContactId === 'none' ? null : values.ownerContactId;
        const oldOwnerContactId = propertyData?.ownerContactId;
        const newTenantContactId = values.tenantContactId === 'none' ? null : values.tenantContactId;
        const oldTenantContactId = propertyData?.tenantContactId;

        const updatedProperty: Omit<Partial<Property>, 'id'> = {
          ...propertyData,
          ...values,
          imageUrls: allImageUrls,
          portalPublish: portalPublishData,
          ownerContactId: newOwnerContactId,
          tenantContactId: newTenantContactId,
        };

        // Handle owner linking logic
        if (newOwnerContactId !== oldOwnerContactId) {
            if (oldOwnerContactId) {
                await updateDoc(doc(firestore, `agents/${user.uid}/contacts`, oldOwnerContactId), { linkedPropertyIds: arrayRemove(propertyId) });
            }
            if (newOwnerContactId) {
                await updateDoc(doc(firestore, `agents/${user.uid}/contacts`, newOwnerContactId), { linkedPropertyIds: arrayUnion(propertyId) });
            }
        }
        
        // Handle tenant linking logic
        if (newTenantContactId !== oldTenantContactId) {
            if (oldTenantContactId) {
                await updateDoc(doc(firestore, `agents/${user.uid}/contacts`, oldTenantContactId), { linkedPropertyIds: arrayRemove(propertyId) });
            }
            if (newTenantContactId) {
                await updateDoc(doc(firestore, `agents/${user.uid}/contacts`, newTenantContactId), { linkedPropertyIds: arrayUnion(propertyId) });
            }
        }
        
        await setDoc(propertyRef, updatedProperty, { merge: true });
        mutate();
        setFilesToUpload([]);
        
        toast({ title: "Imóvel Atualizado!", description: `${values.title} foi atualizado.`, });
        router.push('/imoveis');
    } catch (error) {
        console.error("Erro ao atualizar imóvel:", error);
        toast({title: "Erro ao salvar", description: (error as Error).message, variant: "destructive"});
    }
  }
  
  const operationType = form.watch('operation');

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
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Pencil /> Editar Imóvel</CardTitle>
                    <CardDescription>Altere os detalhes do imóvel <span className="font-semibold text-primary">{propertyData?.title || '...'}</span>.</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="complete-form-switch" checked={showCompleteForm} onCheckedChange={setShowCompleteForm} />
                    <Label htmlFor="complete-form-switch">Cadastro Completo</Label>
                </div>
            </div>
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
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
                
                <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="R$ 850.000,00" onChange={handlePriceChange('price')} defaultValue={field.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(field.value) : ''}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                {showCompleteForm && (
                     <div className="space-y-8 p-6 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">O cadastro completo é ideal para exportar para portais imobiliários. Você pode preencher estes campos depois em "Editar Imóvel".</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                         <FormField control={form.control} name="videoUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2"><Video /> Vídeo do Imóvel (Opcional)</FormLabel>
                                <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
                                <FormDescription>Cole aqui a URL de um vídeo do YouTube ou Vimeo.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )} />

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
                    </div>
                )}
                
                {operationType === 'Aluguel' && (
                  <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><FileText/> Detalhes do Aluguel</h3>
                    <FormField
                        control={form.control}
                        name="tenantContactId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><User className="w-4 h-4"/> Inquilino (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o inquilino do imóvel" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {tenants.map((tenant: Contact) => (
                                    <SelectItem key={tenant.id} value={tenant.id}>{tenant.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormDescription>Associe um contato do tipo "inquilino" a este imóvel alugado.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Controller
                          control={form.control}
                          name="rentalDetails.startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Início do Contrato</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                       <Controller
                          control={form.control}
                          name="rentalDetails.endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fim do Contrato</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>Escolha uma data</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                  </div>
                )}


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
                    <div className="flex justify-between items-center">
                        <FormLabel>Descrição Completa</FormLabel>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" size="sm" disabled={isGeneratingDescription || !limits.aiDescriptions}>
                                {isGeneratingDescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Gerar com IA
                                <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => handleGenerateDescription('short')}>
                                Curto e Objetivo
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleGenerateDescription('detailed')}>
                                Detalhado e Criativo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <FormControl>
                        <Textarea placeholder="Descreva os detalhes do imóvel..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <Separator />
                
                <FormItem>
                  <FormLabel>Imagens do Imóvel</FormLabel>
                  <FormDescription>Adicione novas imagens ou remova as existentes.</FormDescription>
                  <ImageUpload onFileSelect={setFilesToUpload} multiple />
                
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
