
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Property } from "@/lib/data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { MapPin, BedDouble, Bath, Car, Home as HomeIcon, Ruler } from "lucide-react";
import { Separator } from "./ui/separator";

interface PropertyPreviewDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewDialog({ property, open, onOpenChange }: PropertyPreviewDialogProps) {

  const isValidUrl = (url: string | undefined): boolean => {
    return !!url && (url.startsWith('http://') || url.startsWith('https://'));
  }

  const defaultImage = `https://picsum.photos/seed/${property.id}/1280/720`;
  
  const images = property.imageUrls && property.imageUrls.length > 0 && property.imageUrls.every(isValidUrl)
      ? property.imageUrls 
      : [defaultImage];

  const formattedPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
            <div className="relative w-full aspect-video rounded-md overflow-hidden mb-4">
                 <Carousel className="w-full h-full">
                    <CarouselContent>
                        {images.map((imageUrl, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-video relative h-full">
                                    <Image
                                        src={imageUrl}
                                        alt={`${property.title || 'Imagem do imóvel'} - Imagem ${index + 1}`}
                                        fill
                                        sizes="80vw"
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
            </div>
          <DialogTitle className="text-2xl font-bold font-headline">{property.title}</DialogTitle>
          <DialogDescription className="flex items-center text-muted-foreground text-md">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{property.neighborhood}, {property.city}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div className="flex justify-between items-center">
                 <Badge>{property.operation}</Badge>
                 <p className="text-2xl font-bold text-primary">
                    {property.operation === 'Comprar' ? formattedPrice(property.price) : `${formattedPrice(property.price)} /mês`}
                </p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
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
                    <HomeIcon className="w-6 h-6 text-primary" />
                    <span className="font-semibold">{property.rooms}</span>
                    <span className="text-xs text-muted-foreground">Cômodos</span>
                </div>
                 <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Ruler className="w-6 h-6 text-primary" />
                    <span className="font-semibold">{property.builtArea} m²</span>
                    <span className="text-xs text-muted-foreground">Área</span>
                </div>
            </div>

            <Separator />

             <div>
                <h3 className="text-lg font-bold font-headline mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-h-48 overflow-y-auto">
                    {property.description}
                </p>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
