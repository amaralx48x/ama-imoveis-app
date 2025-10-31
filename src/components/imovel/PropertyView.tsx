'use client';

import type { Property } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bath, Ruler, MapPin, Car, Home, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PropertyViewProps {
    property: Property;
}

export function PropertyView({ property }: PropertyViewProps) {

    const images = property.imageUrls.map(id => PlaceHolderImages.find(img => img.id === id) || PlaceHolderImages[0]);
    if (images.length === 0) {
        images.push(PlaceHolderImages.find(img => img.id === 'property-1-1') || PlaceHolderImages[0]);
    }

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(property.price);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna principal com detalhes */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    {/* Carrossel de Imagens */}
                    <Carousel className="w-full">
                        <CarouselContent>
                            {images.map((image, index) => (
                                <CarouselItem key={index}>
                                    <div className="aspect-video relative rounded-lg overflow-hidden border">
                                        <Image
                                            src={image.imageUrl}
                                            alt={`${property.title} - Imagem ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={image.imageHint}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                         <CarouselPrevious className="absolute left-4" />
                        <CarouselNext className="absolute right-4" />
                    </Carousel>
                </div>

                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <Badge className="mb-2">{property.operation}</Badge>
                                <CardTitle className="text-3xl font-headline">{property.title}</CardTitle>
                                <div className="flex items-center text-muted-foreground text-md mt-2">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    <span>{property.address}</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-3xl font-bold text-primary">
                                    {property.operation === 'Venda' ? formattedPrice : `${formattedPrice} /mês`}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
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
                                <Home className="w-7 h-7 text-primary" />
                                <span className="font-semibold">{property.rooms}</span>
                                <span className="text-xs text-muted-foreground">Cômodos</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-2 rounded-lg bg-muted/50">
                                <Ruler className="w-7 h-7 text-primary" />
                                <span className="font-semibold">{property.builtArea} m²</span>
                                <span className="text-xs text-muted-foreground">Área</span>
                            </div>
                        </div>
                         <Separator className="my-6" />
                         <div>
                            <h3 className="text-xl font-bold font-headline mb-4">Descrição</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {property.description}
                            </p>
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* Coluna lateral com contato */}
            <div className="lg:col-span-1">
                 <Card className="sticky top-24">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Ficou interessado?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">Entre em contato para agendar uma visita ou tirar suas dúvidas.</p>
                        <Button className="w-full" size="lg" asChild>
                            <a href="tel:+5511999999999">
                                <Phone className="mr-2 h-5 w-5" />
                                Ligar Agora
                            </a>
                        </Button>
                        <Button className="w-full" size="lg" variant="outline" asChild>
                           <a href="mailto:contato@amaimoveis.com">
                                <Mail className="mr-2 h-5 w-5" />
                                Enviar E-mail
                           </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}