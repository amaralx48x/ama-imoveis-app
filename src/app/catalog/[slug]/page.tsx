
'use client';

import { Suspense } from 'react';
import { useSearchParams, notFound, useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import type { CatalogPage, Agent } from '@/lib/data';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { ContactForm } from '@/components/contact-form';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BedDouble, Bath, Car, Ruler, Users, Star, Info, MessageSquare, Map, GalleryHorizontal, Video, CheckCircle, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function PageSkeleton() {
    return (
        <div className="animate-pulse">
            <header className="sticky top-0 z-50 h-14 border-b bg-background/95">
                <div className="container flex items-center justify-between h-full">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-24" />
                </div>
            </header>
            <main>
                <Skeleton className="h-[60vh] w-full" />
                <div className="container -mt-20 relative z-10">
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
                <div className="container py-12 space-y-10">
                    <Skeleton className="h-96 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </main>
        </div>
    )
}

function CatalogClientPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const agentId = searchParams.get('agentId');
    const firestore = useFirestore();

    const catalogPageQuery = useMemoFirebase(() => {
        if (!agentId || !slug || !firestore) return null;
        return query(
            collection(firestore, `agents/${agentId}/catalogPages`),
            where('slug', '==', slug)
        );
    }, [agentId, slug, firestore]);
    
    const { data: pages, isLoading: isPageLoading } = useCollection<CatalogPage>(catalogPageQuery);
    const pageData = pages?.[0];

    const agentRef = useMemoFirebase(() => {
        if (!agentId || !firestore) return null;
        return doc(firestore, 'agents', agentId);
    }, [agentId, firestore]);
    
    const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

    if (isPageLoading || isAgentLoading) return <PageSkeleton />;
    if (!pageData || !agentData) return notFound();

    return (
        <div className="bg-background text-foreground">
            <Header agent={agentData} agentId={agentId || undefined} />
            <main>
                {/* Hero */}
                <section className="relative h-[70vh] flex items-end justify-center text-white pb-16">
                    <Image src={pageData.heroImageUrl || 'https://picsum.photos/seed/hero/1920/1080'} alt={pageData.title || ''} fill priority className="object-cover brightness-50"/>
                    <div className="relative z-10 text-center container">
                        <h1 className="text-5xl md:text-7xl font-extrabold font-headline">{pageData.title}</h1>
                        <p className="mt-4 text-xl md:text-2xl text-white/80">{pageData.subtitle}</p>
                    </div>
                </section>

                {/* Main Content */}
                <div className="container -mt-10 relative z-20 space-y-16 py-10">
                    
                    {/* Ficha Técnica */}
                    {pageData.technicalDetails && pageData.technicalDetails.length > 0 && (
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Info/> Ficha Técnica</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {pageData.technicalDetails.map(detail => (
                                    <div key={detail.label} className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">{detail.label}</p>
                                        <p className="font-bold text-lg">{detail.value}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Galerias */}
                     {(pageData.galleryImages || pageData.plantImages) && (
                        <Card className="shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><GalleryHorizontal/> Galeria</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-8">
                                {pageData.galleryImages && pageData.galleryImages.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-4">Fotos do Empreendimento</h3>
                                        <Carousel><CarouselContent>{pageData.galleryImages.map(url => (<CarouselItem key={url} className="md:basis-1/2 lg:basis-1/3"><Image src={url} alt="Galeria" width={600} height={400} className="rounded-lg aspect-video object-cover"/></CarouselItem>))}</CarouselContent><CarouselPrevious/><CarouselNext/></Carousel>
                                    </div>
                                )}
                                {pageData.plantImages && pageData.plantImages.length > 0 && (
                                     <div>
                                        <h3 className="font-semibold mb-4">Plantas</h3>
                                        <Carousel><CarouselContent>{pageData.plantImages.map(url => (<CarouselItem key={url} className="md:basis-1/2 lg:basis-1/3"><Image src={url} alt="Planta" width={600} height={400} className="rounded-lg aspect-square object-contain border p-2"/></CarouselItem>))}</CarouselContent><CarouselPrevious/><CarouselNext/></Carousel>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    
                    {/* Vídeo */}
                    {pageData.videoUrl && (
                        <Card className="shadow-xl">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Video/> Vídeo</CardTitle></CardHeader>
                            <CardContent><div className="aspect-video rounded-lg overflow-hidden"><iframe width="100%" height="100%" src={pageData.videoUrl.replace('watch?v=', 'embed/')} allowFullScreen></iframe></div></CardContent>
                        </Card>
                    )}

                    {/* Descrição e Diferenciais */}
                     <Card className="shadow-xl">
                        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare/> O Empreendimento</CardTitle></CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div className="prose dark:prose-invert max-w-none"><p>{pageData.fullDescription}</p></div>
                             {pageData.differentials && pageData.differentials.length > 0 && (
                                <div className="space-y-3">
                                    {pageData.differentials.map(d => (
                                        <div key={d.label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"><CheckCircle className="text-primary w-5 h-5"/><span>{d.label}</span></div>
                                    ))}
                                </div>
                             )}
                        </CardContent>
                    </Card>

                    {/* Mapa */}
                    {pageData.mapLocationQuery && (
                        <Card className="shadow-xl">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Map/> Localização</CardTitle></CardHeader>
                            <CardContent><div className="aspect-video w-full rounded-lg overflow-hidden border"><iframe width="100%" height="100%" style={{border:0}} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent(pageData.mapLocationQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}></iframe></div></CardContent>
                        </Card>
                    )}

                    {/* Prova Social */}
                    {(pageData.testimonials || pageData.socialProofText) && (
                        <Card className="shadow-xl">
                             <CardHeader><CardTitle className="flex items-center gap-2"><Star/> O que dizem</CardTitle></CardHeader>
                             <CardContent className="space-y-6">
                                {pageData.socialProofText && <p className="text-center text-2xl font-bold text-primary">{pageData.socialProofText}</p>}
                                {pageData.testimonials && pageData.testimonials.length > 0 && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {pageData.testimonials.map(t => (
                                            <blockquote key={t.author} className="p-4 border rounded-lg bg-muted/50">
                                                <p className="italic">"{t.text}"</p>
                                                <footer className="mt-2 text-sm font-semibold text-right">- {t.author}</footer>
                                            </blockquote>
                                        ))}
                                    </div>
                                )}
                             </CardContent>
                        </Card>
                    )}
                </div>
            </main>
             <Footer agentId={agentId || undefined}/>
             {/* Floating CTA */}
             <div className="sticky bottom-0 z-30 bg-background/80 backdrop-blur-sm border-t p-4">
                <div className="container flex items-center justify-center">
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg animate-pulse">{pageData.ctaButtonText || 'Fale com um Corretor'}</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <ContactForm agentId={agentId!} propertyId={pageData.id} title={`Interesse em ${pageData.title}`} description="Preencha seus dados e retornaremos o mais breve possível." isDialog onFormSubmit={() => {}} />
                        </DialogContent>
                    </Dialog>
                </div>
             </div>
        </div>
    );
}

export default function CatalogPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <CatalogClientPage />
        </Suspense>
    )
}
