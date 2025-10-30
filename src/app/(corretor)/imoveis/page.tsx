'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { PropertyCard } from '@/components/property-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/data';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ImoveisPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const propertiesCollection = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, `agents/${user.uid}/properties`);
    }, [firestore, user]);

    const { data: properties, isLoading, error } = useCollection<Property>(propertiesCollection);
    
    const propertyImages = (p: Property) => {
      const imageId = p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : p.images?.[0];
      return PlaceHolderImages.find(img => img.id === imageId) || PlaceHolderImages[0];
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Meus Imóveis</h1>
                    <p className="text-muted-foreground">Gerencie seu portfólio de imóveis.</p>
                </div>
                <Button asChild className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                    <Link href="/imoveis/novo">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Imóvel
                    </Link>
                </Button>
            </div>

            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[224px] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Imóveis</AlertTitle>
                    <AlertDescription>
                        Não foi possível buscar seus imóveis no momento. Verifique sua conexão ou tente novamente mais tarde.
                    </AlertDescription>
                </Alert>
            )}

            {!isLoading && !error && properties && properties.length === 0 && (
                 <div className="text-center py-16 rounded-lg border-2 border-dashed">
                    <h2 className="text-2xl font-bold mb-2">Nenhum imóvel cadastrado</h2>
                    <p className="text-muted-foreground mb-4">Que tal adicionar seu primeiro imóvel agora?</p>
                    <Button asChild>
                        <Link href="/imoveis/novo">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Primeiro Imóvel
                        </Link>
                    </Button>
                </div>
            )}

            {!isLoading && properties && properties.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} imagePlaceholder={propertyImages(property)} />
                  ))}
              </div>
            )}
        </div>
    );
}
