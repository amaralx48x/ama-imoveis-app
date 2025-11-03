

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import PropertyFilters from '@/components/property-filters';
import type { Agent } from '@/lib/data';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Mock agent data for filter component on the main page, since no user is logged in
  const mockAgent: Agent = {
    id: 'global',
    displayName: 'Global Search',
    name: 'AMA Imóveis',
    accountType: 'imobiliaria',
    email: '',
    description: '',
    creci: '',
    photoUrl: '',
    cities: ['São Paulo', 'Campinas', 'Ubatuba', 'Guarujá', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre'],
  }
  const propertyTypes = ['Apartamento', 'Casa', 'Chácara', 'Galpão', 'Sala', 'Kitnet', 'Terreno', 'Lote', 'Alto Padrão'];


  useEffect(() => {
    // This logic can be reinstated or changed based on desired initial behavior
    // For now, we show a global search page.
    /*
    if (!isUserLoading) {
      if (user) {
        // If user is logged in, redirect to their public agent page.
        router.replace(`/corretor/${user.uid}`);
      } else {
        // If no user is logged in, redirect to the login page.
        router.replace('/login');
      }
    }
    */
  }, [user, isUserLoading, router]);

    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            <p className="ml-4 text-muted-foreground">Carregando...</p>
            </div>
        );
    }

  return (
    <div className="container mx-auto p-6 space-y-10">
      <section className="text-center space-y-4 pt-16">
        <h1 className="text-3xl lg:text-5xl font-bold font-headline">Encontre seu novo lar 🏡</h1>
        <p className="text-lg text-muted-foreground">Busque imóveis à venda ou para alugar em todo o Brasil</p>
      </section>
      
      <div className="max-w-5xl mx-auto">
        <PropertyFilters agent={mockAgent} propertyTypes={propertyTypes} />
      </div>


      {/* Aqui você pode mostrar destaques, categorias, etc */}
    </div>
  );
}

