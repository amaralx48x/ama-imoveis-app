
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
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import ImageUpload from "@/components/image-upload";
import { useState, useMemo } from "react";
import Image from "next/image";
import type { Agent, CustomSection } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";


const propertyTypes = ["Apartamento", "Casa", "Chácara", "Galpão", "Sala", "Kitnet", "Terreno", "Lote", "Alto Padrão"];

const formSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres."),
  city: z.string().min(1, "A cidade é obrigatória."),
  neighborhood: z.string().min(2, "O bairro deve ter pelo menos 2 caracteres."),
  type: z.enum(propertyTypes as [string, ...string[]]),
  operation: z.enum(["Comprar", "Alugar"]),
  price: z.number().positive("O preço deve ser um número positivo."),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  garage: z.coerce.number().int().min(0),
  rooms: z.coerce.number().int().min(0),
  builtArea: z.coerce.number().positive("A área construída deve ser positiva."),
  totalArea: z.coerce.number().positive("A área total deve ser positiva."),
  sectionIds: z.array(z.string()).default([]),
  phone: z.string().optional(),
  useAgentPhone: z.boolean().default(true),
});

export default function NovoImovelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const agentRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'agents', user.uid) : null), [firestore, user]);
  const { data: agentData } = useDoc<Agent>(agentRef);

  const sectionsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `agents/${user.uid}/customSections`) : null),
    [user, firestore]
  );
  const { data: sections } = useCollection<CustomSection>(sectionsCollection);


  const [imageUrls, setImageUrls] = useState<string[]>([]);
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
      sectionIds: [],
      phone: "",
      useAgentPhone: true,
    },
  });

  const useAgentPhoneValue = form.watch('useAgentPhone');

  const handleUploadComplete = (urls: string[]) => {
    setImageUrls(prev => [...prev, ...urls]);
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
    
    // Format for display
    e.target.value = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            title: "Erro de Autenticação",
            description: "Você precisa estar logado para adicionar um imóvel.",
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

    const newProperty = {
      ...values,
      id: propertyId,
      agentId: user.uid,
      imageUrls: imageUrls,
      createdAt: new Date().toISOString(),
      status: 'ativo' as const,
      phone: values.useAgentPhone ? '' : values.phone,
    };
    
    const propertyRef = doc(firestore, `agents/${user.uid}/properties`, propertyId);
    
    setDocumentNonBlocking(propertyRef, newProperty, { merge: false });
    toast({
        title: "Imóvel Adicionado!",
        description: `${values.title} foi cadastrado com sucesso.`,
    });
    router.push('/imoveis');
  }

  const allSections = [{ id: 'featured', title: 'Imóveis em Destaque' }, ...(sections || [])];


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
                            <SelectTrigger><SelectValue placeholder="Comprar ou Alugar" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Comprar">Comprar</SelectItem>
                            <SelectItem value="Alugar">Alugar</SelectItem>
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

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contato Telefônico</h3>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone de Contato do Imóvel</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(11) 98888-7777"
                            {...field}
                            disabled={useAgentPhoneValue}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="useAgentPhone"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Usar meu telefone principal
                          </FormLabel>
                          <FormDescription>
                            Irá usar o número de telefone cadastrado no seu perfil ({agentData?.phone || "nenhum"}).
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                
                <FormItem>
                <FormLabel>Imagens do Imóvel</FormLabel>
                <FormDescription>Envie até 20 fotos do seu imóvel. A primeira será a imagem de capa.</FormDescription>
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

                <FormField
                  control={form.control}
                  name="sectionIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Seções do Site</FormLabel>
                        <FormDescription>
                          Selecione em quais seções este imóvel deve aparecer.
                        </FormDescription>
                      </div>
                      {allSections.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="sectionIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.title}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                Salvar Imóvel
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>
    </div>
  );
}
