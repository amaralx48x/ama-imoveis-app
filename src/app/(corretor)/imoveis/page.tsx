'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { getAllProperties } from '@/lib/data';
import { PropertyCard } from '@/components/property-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

export default function ImoveisPage() {
    const properties = getAllProperties();
    const propertyImages = (p: any) => PlaceHolderImages.find(img => img.id === p.images[0]) || PlaceHolderImages[0];

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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} imagePlaceholder={propertyImages(property)} />
                ))}
            </div>
        </div>
    );
}