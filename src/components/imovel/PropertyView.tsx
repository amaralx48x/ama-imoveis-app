
'use client';

import type { Property, Agent } from "@/lib/data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Bath, Ruler, MapPin, Car, Home, Phone, Mail, Printer, Link as LinkIcon, CalendarPlus, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContactForm } from "@/components/contact-form";
import { useState } from "react";
import { SchedulingForm } from "@/components/scheduling-form";


// Simple inline SVG for WhatsApp and Facebook as they are not in lucide-react
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 32 32" className="w-5 h-5" {...props}><path d=" M19.11 17.205c-.372 0-1.088 1.39-1.088 1.39s-1.088-1.39-1.088-1.39c-1.615 0-2.822-1.207-2.822-2.822s1.207-2.822 2.822-2.822c.433 0 .837.103 1.188.29l-1.188-1.188-1.188 1.188c-.35-.187-.755-.29-1.188-.29-1.615 0-2.822 1.207-2.822 2.822s1.207 2.822 2.822 2.822c.372 0 1.088-1.39 1.088-1.39s1.088 1.39 1.088 1.39c1.615 0 2.822-1.207 2.822-2.822s-1.207-2.822-2.822-2.822c-.433 0-.837.103-1.188.29l1.188-1.188-1.188 1.188c.35-.187.755-.29 1.188-.29 1.615 0 2.822 1.207 2.822 2.822s-1.207 2.822-2.822-2.822z" fill="currentColor"></path></svg>
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


    const isValidUrl = (url: string | undefined): boolean => {
        return !!url && (url.startsWith('http://') || url.startsWith('https://'));
    }

    const defaultImage = `https://picsum.photos/seed/${property.id}/1280/720`;
    
    const images = property.imageUrls && property.imageUrls.length > 0 && property.imageUrls.every(isValidUrl)
        ? property.imageUrls 
        : [defaultImage];

    const formattedPrice = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const iptu = property.price * 0.0006; // Example: 0.06% of property value
    const totalPrice = property.operation === 'Alugar' ? property.price + iptu : property.price;

    const showFinancingButton = agent.siteSettings?.showFinancing ?? true;
    
    // --- Nova Lógica de Contato ---
    const contactPhone = agent.phone; // Usa sempre o telefone principal do agente
    const canCall = !!contactPhone;
    const callLink = `tel:${contactPhone?.replace(/\D/g, '')}`;
    
    const whatsappNumber = agent.siteSettings?.socialLinks?.find(link => link.icon === 'whatsapp')?.url;
    const prefilledMessage = encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title}, localizado no bairro ${property.neighborhood}.`);
    const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${prefilledMessage}` : '#';

    // Link de financiamento agora também vai para o WhatsApp com a mensagem
    const financingLink = whatsappLink; 
    const isFinancingButtonActionable = showFinancingButton && !!whatsappNumber;


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna principal com detalhes */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    {/* Carrossel de Imagens */}
                    <Carousel className="w-full">
                        <CarouselContent>
                            {images.map((imageUrl, index) => (
                                <CarouselItem key={index}>
                                    <div className="aspect-video relative rounded-lg overflow-hidden border">
                                        <Image
                                            src={imageUrl}
                                            alt={`${property.title} - Imagem ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="house interior"
                                            sizes="(max-width: 1200px) 90vw, 66vw"
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
                                    <span>{property.neighborhood}, {property.city}</span>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-3xl font-bold text-primary">
                                    {property.operation === 'Comprar' ? formattedPrice(property.price) : `${formattedPrice(property.price)} /mês`}
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
                    <CardContent className="pt-6 space-y-3">
                         <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{property.operation === 'Alugar' ? 'Locação' : 'Valor'}</span>
                                <span className="font-semibold">{formattedPrice(property.price)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">IPTU (aprox.)</span>
                                <span className="font-semibold">{formattedPrice(iptu)}</span>
                            </div>
                             <Separator className="my-2"/>
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>{formattedPrice(totalPrice)}</span>
                            </div>
                        </div>

                        <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg" disabled={!whatsappNumber}>
                            <Link href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="mr-2"/>
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
                        
                        {showFinancingButton && (
                             <Button asChild className="w-full" size="lg" variant="outline" disabled={!isFinancingButtonActionable}>
                                <Link href={financingLink || '#'} target="_blank" rel="noopener noreferrer">
                                    <LinkIcon className="mr-2"/>
                                    Simule o Financiamento
                                </Link>
                            </Button>
                        )}


                        <div className="text-center pt-4">
                            <p className="text-sm font-semibold mb-3">COMPARTILHAR</p>
                            <div className="flex justify-center gap-3">
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11"><WhatsAppIcon /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11"><FacebookIcon /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11"><XIcon /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11"><Mail /></Button>
                                <Button variant="outline" size="icon" className="rounded-full h-11 w-11"><Printer /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    
