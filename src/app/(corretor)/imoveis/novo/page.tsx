'use client';

import { useForm, useFieldArray } from "react-hook-form";
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
import { getPropertyCities, getPropertyTypes } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';


const formSchema = z.object({
  title: z.string().min(5, "O título deve ter pelo menos 5 caracteres."),
  description: z.string().min(20, "A descrição deve ter pelo menos 20 caracteres."),
  city: z.string().min(1, "A cidade é obrigatória."),
  type: z.enum(["Apartamento", "Casa", "Terreno"]),
  operation: z.enum(["Venda", "Aluguel"]),
  price: z.preprocess(
    (a) => parseFloat(String(a).replace(/[^0-9,]/g, '').replace(',', '.')),
    z.number().positive("O preço deve ser um número positivo.")
  ),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  garage: z.coerce.number().int().min(0),
  rooms: z.coerce.number().int().min(0),
  builtArea: z.coerce.number().positive("A área construída deve ser positiva."),
  totalArea: z.coerce.number().positive("A área total deve ser positiva."),
  images: z.array(z.object({ url: z.string().url("URL da imagem inválida.").or(z.literal('')) })).optional(),
  featured: z.boolean().default(false),
});

export default function NovoImovelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const cities = getPropertyCities();
  const types = getPropertyTypes();
  const firestore = useFirestore();
  const auth = useAuth();
  
  // Hardcoded agentId for now, will be replaced with logged in user
  const agentId = 'ana-maria-almeida';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      garage: 0,
      rooms: 0,
      builtArea: 0,
      totalArea: 0,
      images: [],
      featured: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;

    const propertyId = uuidv4();
    const imageUrls = values.images?.map(img => img.url).filter(url => url) || [];
    
    if (imageUrls.length === 0) {
      imageUrls.push('property-1-1'); // Default image
    }

    const newProperty = {
      ...values,
      id: propertyId,
      agentId,
      imageUrls: imageUrls,
      // Dummies for missing fields in form
      address: `${values.city}`,
      area: values.totalArea,
      propertyType: values.type,
      operationType: values.operation
    };
    
    const propertiesCollection = collection(firestore, `agents/${agentId}/properties`);
    
    try {
        await addDocumentNonBlocking(propertiesCollection, newProperty);
        toast({
          title: "Imóvel Adicionado!",
          description: `${values.title} foi cadastrado com sucesso.`,
        });
        router.push('/imoveis');
    } catch(e) {
        console.error("Error adding document: ", e);
        toast({
            title: "Erro ao adicionar imóvel",
            description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
            variant: "destructive"
        });
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Adicionar Novo Imóvel</CardTitle>
        <CardDescription>Preencha os detalhes abaixo para cadastrar um novo imóvel no seu portfólio.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Título */}
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

            {/* Operação, Cidade, Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
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
                        {types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Preço */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="500.000,00" {...field} onChange={e => {
                        const value = e.target.value.replace(/\D/g, '');
                        const numberValue = Number(value) / 100;
                        field.onChange(numberValue);
                        e.target.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue).replace('R$', '').trim();
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quartos, Banheiros, Garagem, Cômodos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Quartos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Banheiros</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="garage" render={({ field }) => (<FormItem><FormLabel>Vagas Garagem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
               <FormField control={form.control} name="rooms" render={({ field }) => (<FormItem><FormLabel>Cômodos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            {/* Área Construída, Área Total */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="builtArea" render={({ field }) => (<FormItem><FormLabel>Área Construída (m²)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="totalArea" render={({ field }) => (<FormItem><FormLabel>Área Total (m²)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            {/* Descrição */}
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
            
            {/* Imagens */}
            <div>
              <FormLabel>Imagens do Imóvel</FormLabel>
              <FormDescription>Adicione URLs para as imagens. A primeira será a imagem de capa. (Opcional para teste)</FormDescription>
              <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                     <FormField
                        control={form.control}
                        name={`images.${index}.url`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                            <FormControl>
                                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ url: "" })}
                >
                  Adicionar URL de Imagem
                </Button>
                <FormMessage>{form.formState.errors.images?.message}</FormMessage>
              </div>
            </div>

             {/* Destaque */}
             <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Marcar como Destaque
                        </FormLabel>
                        <FormDescription>
                        Imóveis em destaque aparecem na seção principal do seu site.
                        </FormDescription>
                    </div>
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
  );
}
