
'use client';

import type { Property, Agent } from "@/lib/data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bath, Ruler, MapPin, Car, Home, Phone, Mail, Printer, Link as LinkIcon, CalendarPlus, MessageCircle, Expand } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contact-form";
import { useState, useEffect, useCallback } from "react";
import { SchedulingForm } from "@/components/scheduling-form";
import { cn } from "@/lib/utils";


const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.77.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.78 1.21h.01c5.46 0 9.91-4.45 9.91-9.91c0-5.46-4.45-9.91-9.91-9.91zM17.53 15.3c-.27-.13-1.59-.78-1.84-.87c-.25-.09-.43-.13-.62.13c-.19.27-.7.87-.86 1.04c-.16.17-.32.19-.59.06c-1.39-.67-2.4-1.29-3.21-2.22c-.67-.78-1.12-1.58-1.29-1.95c-.17-.37-.02-.57.11-.7c.12-.12.27-.31.41-.46c.14-.15.19-.27.28-.46c.09-.19.05-.37-.02-.51c-.07-.13-.62-1.49-.84-2.03c-.23-.54-.46-.47-.62-.47c-.16 0-.34-.02-.52-.02c-.18 0-.46.07-.7.34c-.24.27-.92.89-1.12 2.14c-.2 1.25.12 2.76 1.39 4.39c1.07 1.37 2.14 2.5 4.39 3.53c.53.24 1.29.35 2.22.35c.93 0 1.7-.13 2.3-.43c.7-.35 1.25-.87 1.63-1.63c.24-.46.35-.98.35-1.52c0-.53-.11-.98-.24-1.36c-.13-.37-.28-.56-.45-.69c-.18-.13-.39-.2-.59-.2c-.2 0-.46.06-.63.13z"
      />
    </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" {...props}><path d="M12 2.04c-5.5 0-10 4.49-10 10s4.5 10 10 10 10-4.49 10-10-4.5-10-10-10zm1.5 10.96h-2v6h-3v-6h-1.5v-2.5h1.5v-2c0-1.2.7-2.5 2.5-2.5h2v2.5h-1.5c-.2 0-.5.2-.5.5v1.5h2l-.5 2.5z" fill="currentColor"></path></svg>
);
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" {...props}><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" fill="currentColor"></path></svg>
);

interface PropertyViewProps {
    property: Property;
    agent: Agent;
}

export function PropertyView({ property, agent }: PropertyViewProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');
    const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
    
    const [mainApi, setMainApi] = useState<CarouselApi>();
    const [thumbApi, setThumbApi] = useState<CarouselApi>();
    const [selectedIndex, setSelectedIndex] = useState(0);


    useEffect(() => {
        setCurrentUrl(window.location.href);
    }, []);

    const onThumbClick = useCallback((index: number) => {
        if (!mainApi || !thumbApi) return;
        mainApi.scrollTo(index);
    }, [mainApi, thumbApi]);


    const onSelect = useCallback(() => {
        if (!mainApi || !thumbApi) return;
        const newSelectedIndex = mainApi.selectedScrollSnap();
        setSelectedIndex(newSelectedIndex);
        thumbApi.scrollTo(newSelectedIndex);
    }, [mainApi, thumbApi, setSelectedIndex]);


    useEffect(() => {
        if (!mainApi) return;
        onSelect();
        mainApi.on("select", onSelect);
        mainApi.on("reInit", onSelect);
    }, [mainApi, onSelect]);


    const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'email') => {
        const encodedUrl = encodeURIComponent(currentUrl);
        const encodedTitle = encodeURIComponent(property.title || 'Confira este imóvel!');

        let shareUrl = '';
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=${encodedTitle}&body=Olá,%0D%0A%0D%0AConfira este imóvel que encontrei: ${encodedUrl}`;
                break;
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const handlePrint = () => {
        window.open(`/imoveis/imprimir/${property.id}`, '_blank');
    }


    const isValidUrl = (url: string | undefined): boolean => {
        return !!url && (url.startsWith('http://') || url.startsWith('https://'));
    }

    const defaultImage = `https://picsum.photos/seed/${property.id}/1280/720`;
    
    const images = property.imageUrls && property.imageUrls.length > 0 && property.imageUrls.every(isValidUrl)
        ? property.imageUrls 
        : [defaultImage];

    const formattedPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const showFinancingButton = agent.siteSettings?.showFinancing ?? true;
    
    const contactPhone = agent.phone;
    const canCall = !!contactPhone;
    const callLink = `tel:${contactPhone?.replace(/\D/g, '')}`;
    
    const whatsappNumber = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp')?.url;
    const prefilledMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title}, localizado no bairro ${property.neighborhood}.`);
    const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${prefilledMessage}` : '#';

    const financingLink = agent.siteSettings?.financingLink || whatsappLink; 
    const isFinancingButtonActionable = showFinancingButton && !!financingLink;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna principal com detalhes */}
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader className="p-0">
                         {/* Fullscreen Dialog */}
                        <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                            <DialogTrigger asChild>
                                <div className="relative cursor-pointer group">
                                     <Carousel className="w-full" setApi={setMainApi}>
                                        <CarouselContent>
                                            {images.map((imageUrl, index) => (
                                                <CarouselItem key={index}>
                                                    <div className="aspect-video relative rounded-lg overflow-hidden">
                                                        <Image
                                                            src={imageUrl}
                                                            alt={`${property.title || 'Imagem do imóvel'} - Imagem ${index + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, 66vw"
                                                            className="object-cover"
                                                            data-ai-hint="house interior"
                                                            priority={index === 0}
                                                        />
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
                                    </Carousel>
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Expand className="w-12 h-12 text-white" />
                                    </div>
                                </div>
                            </DialogTrigger>
                             <DialogContent className="max-w-[90vw] max-h-[90vh] h-full w-full bg-transparent border-none p-2">
                                <Carousel className="w-full h-full" opts={{startIndex: selectedIndex}}>
                                    <CarouselContent>
                                        {images.map((imageUrl, index) => (
                                            <CarouselItem key={index} className="flex items-center justify-center">
                                                <div className="relative w-full h-full max-w-full max-h-full">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`${property.title} - Imagem ${index + 1}`}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
                                </Carousel>
                            </DialogContent>
                        </Dialog>
                       
                        {/* Thumbnail Carousel */}
                        {images.length > 1 && (
                            <div className="p-4">
                                <Carousel setApi={setThumbApi} opts={{ align: "start", slidesToScroll: 1, dragFree: true }} className="w-full">
                                    <CarouselContent className="-ml-2">
                                    {images.map((url, index) => (
                                        <CarouselItem key={index} onClick={() => onThumbClick(index)} className="pl-2 basis-1/4 md:basis-1/6 cursor-pointer">
                                            <div className={cn("relative aspect-square rounded-md overflow-hidden ring-2 ring-transparent transition-all", index === selectedIndex && "ring-primary")}>
                                                <Image src={url} alt={`Thumbnail ${index + 1}`} fill sizes="100px" className="object-cover"/>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                    </CarouselContent>
                                </Carousel>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Badge className="mb-2">{property.operation}</Badge>
                                <CardTitle className="text-3xl font-headline">{property.title}</CardTitle>
                                <div className="flex items-center text-muted-foreground text-md mt-2">
                                    <MapPin className="w-5 h-5 mr-2" />
                                    <span>{property.neighborhood}, {property.city}</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-3xl font-bold text-primary">
                                    {property.operation === 'Venda' ? formattedPrice(property.price) : `${formattedPrice(property.price)} /mês`}
                                </p>
                            </div>
                        </div>
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

            {/* Coluna lateral de contato */}
            <div className="lg:col-span-1">
                <Card className="sticky top-24">
                    <CardContent className="pt-6 space-y-3">
                         <div className="space-y-2 text-sm">
                            <div className="flex justify-between font-bold text-lg">
                                <span>{property.operation === 'Alugar' ? 'Valor do Aluguel' : 'Preço do Imóvel'}</span>
                                <span>{formattedPrice(property.price)}</span>
                            </div>
                        </div>

                        <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg" disabled={!whatsappNumber}>
                            <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="mr-2 h-5 w-5"/>
                                WhatsApp
                            </Link>
                        </Button>
                        <Button asChild className="w-full" size="lg" variant="outline" disabled={!canCall}>
                            <Link href={canCall ? callLink : '#'}>
                                <Phone className="mr-2" />
                                Ligar
                            </Link>
                        </Button>
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full" size="lg" variant="outline">
                                    <MessageCircle className="mr-2"/>
                                    Fale com o corretor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px]">
                                <ContactForm 
                                    agentId={agent.id}
                                    propertyId={property.id}
                                    title="Fale sobre este imóvel"
                                    description={`Preencha os dados abaixo para conversar com um corretor sobre "${property.title}".`}
                                    isDialog={true}
                                    onFormSubmit={() => setIsFormOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                        <Dialog open={isSchedulingOpen} onOpenChange={setIsSchedulingOpen}>
                            <DialogTrigger asChild>
                               <Button className="w-full" size="lg" variant="outline">
                                    <CalendarPlus className="mr-2"/>
                                    Agendar uma visita
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[520px]">
                                <SchedulingForm 
                                    agent={agent}
                                    propertyId={property.id}
                                    onFormSubmit={() => setIsSchedulingOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                        <Separator className="my-4"/>
                        
                        {isFinancingButtonActionable && (
                            <Button asChild className="w-full" size="lg" variant="outline">
                                <Link href={financingLink} target="_blank" rel="noopener noreferrer">
                                    <LinkIcon className="mr-2"/>
                                    Simule o Financiamento
                                </Link>
                            </Button>
                        )}
                        <div className="text-center pt-4">
                            <p className="text-sm font-semibold mb-3">COMPARTILHAR</p>
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={() => handleShare('whatsapp')}><WhatsAppIcon className="h-5 w-5" /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={() => handleShare('facebook')}><FacebookIcon /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={() => handleShare('twitter')}><XIcon /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={() => handleShare('email')}><Mail /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11" onClick={handlePrint}><Printer /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
