
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useParams } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { doc, collection } from "firebase/firestore";
import { useState, useEffect } from "react";
import type { CustomSection, Property } from "@/lib/data";
import Link from "next/link";
import { ArrowLeft, Loader2, FolderSymlink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  sectionIds: z.array(z.string()).default([]),
});

function AssociationFormSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-3 pt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            <Skeleton className="h-11 w-full" />
        </div>
    )
}

export default function AssociarSecoesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const propertyId = params.propertyId as string;

  const propertyRef = useMemoFirebase(() => (firestore && user && propertyId ? doc(firestore, `agents/${user.uid}/properties`, propertyId) : null), [firestore, user, propertyId]);
  const { data: propertyData, isLoading: isPropertyLoading } = useDoc<Property>(propertyRef);
  
  const sectionsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, `agents/${user.uid}/customSections`) : null),
    [user, firestore]
  );
  const { data: sections, isLoading: areSectionsLoading } = useCollection<CustomSection>(sectionsCollection);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sectionIds: [],
    },
  });

  useEffect(() => {
    if (propertyData) {
      form.reset({
        sectionIds: propertyData.sectionIds || [],
      });
    }
  }, [propertyData, form]);

  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!propertyRef) {
        toast({ title: "Erro de Referência", variant: "destructive" });
        return;
    }

    updateDocumentNonBlocking(propertyRef, { sectionIds: values.sectionIds });
    
    toast({
        title: "Seções Atualizadas!",
        description: `As seções do imóvel "${propertyData?.title}" foram atualizadas.`,
    });
    router.push('/imoveis');
  }

  const isLoading = isPropertyLoading || areSectionsLoading;
  const allSections = [{ id: 'featured', title: 'Imóveis em Destaque' }, ...(sections || [])];

  return (
    <div className="space-y-4">
        <Button variant="outline" asChild>
            <Link href="/imoveis">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Meus Imóveis
            </Link>
        </Button>
        <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
              <FolderSymlink />
              Associar a Seções
            </CardTitle>
            <CardDescription>
              Selecione as seções em que o imóvel <span className="font-semibold text-primary">{propertyData?.title || '...'}</span> deve aparecer.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <AssociationFormSkeleton /> : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="sectionIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Seções Disponíveis</FormLabel>
                        <FormDescription>
                          Marque ou desmarque para adicionar ou remover o imóvel das seções.
                        </FormDescription>
                      </div>
                      <div className="space-y-3">
                      {allSections.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="sectionIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== item.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-medium text-base w-full cursor-pointer">
                                  {item.title}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      {allSections.length === 1 && (
                         <div className="text-sm text-muted-foreground p-4 text-center border-dashed border-2 rounded-md">
                            Nenhuma seção personalizada criada. Você pode criar novas seções em <Link href="/configuracoes/secoes" className="text-primary underline">Configurações &rarr; Gerenciar Seções</Link>.
                         </div>
                      )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                    </>
                  ) : "Salvar Associações"}
                </Button>
            </form>
            </Form>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
