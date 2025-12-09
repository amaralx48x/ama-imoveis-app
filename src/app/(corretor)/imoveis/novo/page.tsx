
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
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useContacts } from "@/firebase/hooks/useContacts";
import { doc, setDoc, collection, updateDoc, arrayUnion } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import ImageUpload from "@/components/image-upload";
import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import type { Agent, Contact } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, X, Loader2, User, Video, PlusCircle, Sparkles, ChevronDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePlan } from "@/context/PlanContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { generatePropertyDescription, GeneratePropertyDescriptionInput } from '@/ai/flows/generate-property-description-flow';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


const propertyTypes = ["Apartamento", "Casa", "Chácara", "Galpão", "Sala", "Kitnet", "Terreno", "Lote", "Alto Padrão"];
const operationTypes = ["Venda", "Aluguel"];

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
});

export default function NovoImovelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { limits, canAddNewProperty, isLoading: isPlanLoading } = usePlan();

  const agentRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'agents', user.uid) : null), [firestore, user]);
  const { data: agentData } = useDoc<Agent>(agentRef);
  
  const { contacts } = useContacts(user?.uid || null);
  const owners = useMemo(() => contacts.filter((c: Contact) => c.type === 'owner'), [contacts]);


  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const propertyId = useMemo(() => uuidv4(), []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      city: undefined,
      neighborhood: "",
      operation: undefined,
      type: undefined,
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      rooms: 0,
      builtArea: 0,
      totalArea: 0,
      ownerContactId: undefined,
      videoUrl: '',
      condoFee: 0,
      yearlyTax: 0
    },
  });

  const handleGenerateDescription = async (style: 'short' | 'detailed') => {
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
    setIsSubmitting(true);
    if (!firestore || !user) {
        toast({ title: "Erro de Autenticação", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    if (filesToUpload.length === 0) {
      toast({
        title: "Nenhuma imagem enviada",
        description: "Por favor, adicione pelo menos uma imagem para o imóvel.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    if (!canAddNewProperty()) {
        toast({
            title: "Limite de imóveis atingido!",
            description: `Você já tem ${limits.maxProperties} imóveis. Faça upgrade para adicionar mais.`,
            variant: "destructive"
        });
        setIsSubmitting(false);
        return;
    }

    try {
        const uploadedImageUrls = await uploadImages();

        const ownerContactId = values.ownerContactId === 'none' ? undefined : values.ownerContactId;

        const newProperty: Omit<Partial<Property>, 'id'> = {
          ...values,
          id: propertyId,
          agentId: user.uid,
          imageUrls: uploadedImageUrls,
          createdAt: new Date().toISOString(),
          status: 'ativo' as const,
          sectionIds: ['featured'],
          ownerContactId: ownerContactId,
        };
        
        // Remove undefined fields before saving
        Object.keys(newProperty).forEach(key => newProperty[key as keyof typeof newProperty] === undefined && delete newProperty[key as keyof typeof newProperty]);


        const propertyRef = doc(firestore, `agents/${user.uid}/properties`, propertyId);
        await setDoc(propertyRef, newProperty);
        
        if (ownerContactId) {
            const contactRef = doc(firestore, `agents/${user.uid}/contacts`, ownerContactId);
            await updateDoc(contactRef, {
                linkedPropertyIds: arrayUnion(propertyId)
            });
        }

        toast({
            title: "Imóvel Adicionado!",
            description: `${values.title} foi cadastrado com sucesso.`,
        });
        router.push('/imoveis');
    } catch (error) {
        console.error("Erro ao criar imóvel:", error);
        toast({title: "Erro ao criar imóvel", description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isPlanLoading) {
      return (
         <div className="space-y-4 max-w-2xl mx-auto flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Carregando informações do plano...</p>
        </div>
      )
  }

  if (!canAddNewProperty()) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Button variant="outline" asChild>
            <Link href="/imoveis">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Imóveis
            </Link>
        </Button>
        <Alert variant="destructive">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Limite de Imóveis Atingido!</AlertTitle>
            <AlertDescription>
                Você atingiu o limite de ${limits.maxProperties} imóveis para o seu plano atual. Para continuar adicionando, por favor, faça o upgrade do seu plano.
                <Button asChild variant="link" className="p-0 h-auto ml-1 text-destructive">
                    <Link href="/meu-plano">Fazer Upgrade</Link>
                </Button>
            </AlertDescription>
        </Alert>
      </div>
    );
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
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><PlusCircle /> Adicionar Novo Imóvel</CardTitle>
                    <CardDescription>Preencha os detalhes abaixo para cadastrar um novo imóvel.</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="complete-form-switch" checked={showCompleteForm} onCheckedChange={setShowCompleteForm} />
                    <Label htmlFor="complete-form-switch">Cadastro Completo</Label>
                </div>
            </div>
        </CardHeader>
        <CardContent>
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
                            {operationTypes.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
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
                
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                            <Input type="text" placeholder="R$ 850.000,00" onChange={handlePriceChange('price')} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                {showCompleteForm && (
                     <div className="space-y-8 p-6 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">O cadastro completo é ideal para exportar para portais imobiliários. Você pode preencher estes campos depois em "Editar Imóvel".</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="condoFee" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Condomínio (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="R$ 500,00" onChange={handlePriceChange('condoFee')} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="yearlyTax" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IPTU Anual (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="text" placeholder="R$ 1.200,00" onChange={handlePriceChange('yearlyTax')} />
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
                                <Button type="button" variant="outline" size="sm" disabled={isGeneratingDescription}>
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
                  <FormDescription>Para uma melhor apresentação, use imagens de alta resolução.</FormDescription>
                  <ImageUpload onFileSelect={setFilesToUpload} multiple />
                </FormItem>
                
                 <Separator />

                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                  ) : "Salvar Imóvel"}
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
