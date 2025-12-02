
'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import type { Property, Agent } from '@/lib/data';
import { useParams, notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Car, Home as HomeIcon, Ruler } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function PrintPageSkeleton() {
    return (
        <div className="max-w-3xl mx-auto p-8 bg-background">
            <Skeleton className="w-full aspect-video mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/3 mb-4" />
            <div className="flex justify-between items-center py-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="h-px w-full my-4" />
            <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
            <Skeleton className="h-px w-full my-4" />
            <Skeleton className="h-6 w-1/4 my-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    )
}

export default function ImovelPrintPage() {
    const params = useParams();
    const propertyId = params.propertyId as string;
    const { user } = useUser();
    const firestore = useFirestore();

    const [property, setProperty] = useState<Property | null>(null);
    const [agent, setAgent] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!propertyId || !user?.uid || !firestore) return;

        const fetchPrintData = async () => {
            try {
                const propRef = doc(firestore, `agents/${user.uid}/properties`, propertyId);
                const agentRef = doc(firestore, `agents`, user.uid);
                
                const [propSnap, agentSnap] = await Promise.all([
                    getDoc(propRef),
                    getDoc(agentRef)
                ]);

                if (propSnap.exists()) {
                    setProperty(propSnap.data() as Property);
                }
                if (agentSnap.exists()) {
                    setAgent(agentSnap.data() as Agent);
                }

                if (propSnap.exists() && agentSnap.exists()) {
                    // Trigger print dialog once data is ready
                    setTimeout(() => window.print(), 500);
                }

            } catch (error) {
                console.error("Error fetching data for printing:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrintData();

    }, [propertyId, user, firestore]);

    if (isLoading) {
        return <PrintPageSkeleton />;
    }

    if (!property || !agent) {
        return notFound();
    }
    
    const isValidUrl = (url: string | undefined): boolean => !!url && (url.startsWith('http://') || url.startsWith('https://'));
    const defaultImage = `https://picsum.photos/seed/${property.id}/1280/720`;
    const images = property.imageUrls && property.imageUrls.length > 0 && property.imageUrls.every(isValidUrl)
        ? property.imageUrls
        : [defaultImage];
    const formattedPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


    return (
        <div className="max-w-3xl mx-auto p-8 bg-background text-foreground">
            <header className="flex justify-between items-center mb-6">
                <div>
                     {agent.siteSettings?.logoUrl && <Image src={agent.siteSettings.logoUrl} alt={`Logo de ${agent.name}`} width={40} height={40} className="rounded-sm" />}
                     <h1 className="text-xl font-bold font-headline">{agent.name}</h1>
                </div>
                <div className="text-right text-sm">
                    <p className="font-semibold">{agent.displayName}</p>
                    <p>CRECI: {agent.creci}</p>
                    <p>{agent.phone}</p>
                    <p>{agent.email}</p>
                </div>
            </header>

             <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4">
                <Image src={images[0]} alt={property.title} fill className="object-cover" sizes="100vw" />
            </div>

            <h2 className="text-3xl font-bold font-headline mb-1">{property.title}</h2>
            <div className="flex items-center text-muted-foreground text-lg mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{property.neighborhood}, {property.city}</span>
            </div>

            <div className="py-4 space-y-6">
                <div className="flex justify-between items-center">
                    <Badge>{property.operation}</Badge>
                    <p className="text-3xl font-bold text-primary">
                        {property.operation === 'Venda' ? formattedPrice(property.price) : `${formattedPrice(property.price)} /mês`}
                    </p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <BedDouble className="w-7 h-7 text-primary" />
                        <span className="font-semibold">{property.bedrooms}</span>
                        <span className="text-xs text-muted-foreground">Quartos</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Bath className="w-7 h-7 text-primary" />
                        <span className="font-semibold">{property.bathrooms}</span>
                        <span className="text-xs text-muted-foreground">Banheiros</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Car className="w-7 h-7 text-primary" />
                        <span className="font-semibold">{property.garage}</span>
                        <span className="text-xs text-muted-foreground">Vagas</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <HomeIcon className="w-7 h-7 text-primary" />
                        <span className="font-semibold">{property.rooms}</span>
                        <span className="text-xs text-muted-foreground">Cômodos</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Ruler className="w-7 h-7 text-primary" />
                        <span className="font-semibold">{property.builtArea} m²</span>
                        <span className="text-xs text-muted-foreground">Área</span>
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="text-xl font-bold font-headline mb-2">Descrição</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        {property.description}
                    </p>
                </div>
            </div>
        </div>
    );
}

