
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
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import ImageUpload from "@/components/image-upload";
import { useState, useMemo } from "react";
import Image from "next/image";
import type { Agent } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, X, Gem, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePlan } from "@/context/PlanContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  garage: z.coerce.number().int().min(0),
  rooms: z.coerce.number().int().min(0),
  builtArea: z.coerce.number().positive("A área construída deve ser positiva."),
  totalArea: z.coerce.number().positive("A área total deve ser positiva."),
});

export default function NovoImovelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { limits, canAddNewProperty, isLoading: isPlanLoading } = usePlan();

  const agentRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'agents', user.uid) : null), [firestore, user]);
  const { data: agentData } = useDoc<Agent>(agentRef);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const propertyId = useMemo(() => uuidv4(), []);
  
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
    },
  });

  const handleUploadComplete = (url: string) => {
    setImageUrls(prev => [...prev, url]);
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue === '') {
        form.setValue('price', 0);
        e.target.value = '';
        return;
    }
    const numberValue = Number(rawValue) / 100;
    form.setValue('price', numberValue);
    
    e.target.value = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    if (!firestore || !user) {
        toast({ title: "Erro de Autenticação", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    if (imageUrls.length === 0) {
      toast({
        title: "Nenhuma imagem enviada",
        description: "Por favor, adicione pelo menos uma imagem para o imóvel.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    const newProperty = {
      ...values,
      operation: values.operation === 'Venda' ? 'Comprar' : 'Alugar', // Map to internal value
      id: propertyId,
      agentId: user.uid,
      imageUrls: imageUrls,
      createdAt: new Date().toISOString(),
      status: 'ativo' as const,
      sectionIds: ['featured'], // Automatically add to featured
    };
    
    const propertyRef = doc(firestore, `agents/${user.uid}/properties`, propertyId);
    
    setDocumentNonBlocking(propertyRef, newProperty, { merge: false });
    toast({
        title: "Imóvel Adicionado!",
        description: `${values.title} foi cadastrado com sucesso.`,
    });
    router.push('/imoveis');
    setIsSubmitting(false);
  }

  if (isPlanLoading) {
      return <div>Carregando informações do plano...</div>
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
            <Gem className="h-4 w-4" />
            <AlertTitle>Limite de Imóveis Atingido!</AlertTitle>
            <AlertDescription>
                Você atingiu o limite de imóveis para o seu plano atual. Para continuar adicionando, por favor, faça o upgrade do seu plano.
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
            <CardTitle className="text-3xl font-bold font-headline">Adicionar Novo Imóvel</CardTitle>
            <CardDescription>Preencha os detalhes abaixo para cadastrar um novo imóvel no seu portfólio.</CardDescription>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Preço (R$)</FormLabel>
                            <FormControl>
                                <Input 
                                type="text" 
                                placeholder="R$ 850.000,00" 
                                onChange={handlePriceChange} 
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
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
                
                <FormItem>
                <FormLabel>Imagens do Imóvel</FormLabel>
                <FormDescription>Para uma melhor apresentação, use imagens de alta resolução.</FormDescription>
                {user && (
                    <ImageUpload
                      agentId={user.uid}
                      propertyId={propertyId}
                      onUploadComplete={handleUploadComplete}
                      multiple
                    />
                )}
                {imageUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {imageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                            <Image src={url} alt={`Imagem do imóvel ${index + 1}`} fill className="object-cover" />
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
