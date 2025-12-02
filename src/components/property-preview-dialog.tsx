
'use client';

import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Property, Agent, Contact } from "@/lib/data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bath, Ruler, MapPin, Car, Home, Printer, Link as LinkIcon, FileText } from "lucide-react";
import Link from "next/link";
import { Separator } from "./ui/separator";
import RentalManagementCard from "./rental-management-card";

interface PropertyPreviewDialogProps {
  property: Property | null;
  owner?: Contact | null;
  tenant?: Contact | null;
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewDialog({ property, owner, tenant, agent, open, onOpenChange }: PropertyPreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    if (property) {
      window.open(`/imoveis/imprimir/${property.id}`, '_blank');
    }
  };

  if (!property) return null;

  const isValidUrl = (url: string | undefined): boolean => !!url && (url.startsWith('http://') || url.startsWith('https://'));
  const defaultImage = `https://picsum.photos/seed/${property.id}/1280/720`;
  const images = property.imageUrls && property.imageUrls.length > 0 && property.imageUrls.every(isValidUrl)
      ? property.imageUrls 
      : [defaultImage];
  const formattedPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const detailUrl = `/imovel/${property.id}?agentId=${property.agentId}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{property.title}</DialogTitle>
          <DialogDescription>
            ID do Imóvel: {property.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-4" ref={printRef}>
            <Carousel className="w-full mb-6">
                <CarouselContent>
                    {images.map((imageUrl, index) => (
                        <CarouselItem key={index}>
                            <div className="aspect-video relative rounded-lg overflow-hidden">
                                <Image
                                    src={imageUrl}
                                    alt={`${property.title} - Imagem ${index + 1}`}
                                    fill
                                    sizes="100vw"
                                    className="object-cover"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                 {images.length > 1 && (
                    <>
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                    </>
                 )}
            </Carousel>
            
            <div className="px-1">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <Badge className="mb-2">{property.operation}</Badge>
                        <h2 className="text-2xl font-bold font-headline">{property.title}</h2>
                        <div className="flex items-center text-muted-foreground text-md mt-1">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{property.neighborhood}, {property.city}</span>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-primary">
                            {property.operation === 'Venda' ? formattedPrice(property.price) : `${formattedPrice(property.price)} /mês`}
                        </p>
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center my-4">
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <BedDouble className="w-6 h-6 text-primary" />
                        <span className="font-semibold">{property.bedrooms}</span>
                        <span className="text-xs text-muted-foreground">Quartos</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Bath className="w-6 h-6 text-primary" />
                        <span className="font-semibold">{property.bathrooms}</span>
                        <span className="text-xs text-muted-foreground">Banheiros</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Car className="w-6 h-6 text-primary" />
                        <span className="font-semibold">{property.garage}</span>
                        <span className="text-xs text-muted-foreground">Vagas</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Home className="w-6 h-6 text-primary" />
                        <span className="font-semibold">{property.rooms}</span>
                        <span className="text-xs text-muted-foreground">Cômodos</span>
                    </div>
                     <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Ruler className="w-6 h-6 text-primary" />
                        <span className="font-semibold">{property.builtArea} m²</span>
                        <span className="text-xs text-muted-foreground">Área</span>
                    </div>
                </div>
                <Separator className="my-4" />
                
                {property.status === 'alugado' && (
                    <RentalManagementCard property={property} tenant={tenant}/>
                )}
                
                <div className="mt-6">
                    <h3 className="text-lg font-semibold font-headline mb-2">Descrição</h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {property.description}
                    </p>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {owner && (
                        <div className="p-4 rounded-lg bg-muted/50">
                            <h4 className="font-semibold text-sm mb-2">Proprietário</h4>
                            <p className="text-lg font-bold">{owner.name}</p>
                            <p className="text-xs text-muted-foreground">{owner.phone}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="ghost" asChild>
            <Link href={detailUrl} target="_blank">
                <LinkIcon className="mr-2"/>
                Ver Página Pública
            </Link>
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2" />
            Exportar Ficha
          </Button>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
