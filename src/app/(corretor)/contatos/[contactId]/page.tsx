
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Contact, Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Building, Mail, Phone, Calendar, Hash, StickyNote, FileDown, Home } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import React, { useRef, useEffect, useState } from 'react';

function ContactDetailSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-36" />
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
}

export default function ContactDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contactId = params.contactId as string;
    const { user } = useUser();
    const firestore = useFirestore();
    const printRef = useRef<HTMLDivElement>(null);

    const contactRef = useMemoFirebase(
        () => (user && firestore && contactId ? doc(firestore, `agents/${user.uid}/contacts`, contactId) : null),
        [user, firestore, contactId]
    );

    const { data: contact, isLoading: isContactLoading } = useDoc<Contact>(contactRef);
    const [linkedProperties, setLinkedProperties] = useState<Property[]>([]);

    useEffect(() => {
        if (contact?.linkedPropertyIds && contact.linkedPropertyIds.length > 0 && firestore && user) {
            const fetchProperties = async () => {
                const propsRef = collection(firestore, `agents/${user.uid}/properties`);
                const q = query(propsRef, where('id', 'in', contact.linkedPropertyIds));
                const snapshot = await getDocs(q);
                const props = snapshot.docs.map(d => d.data() as Property);
                setLinkedProperties(props);
            }
            fetchProperties();
        } else {
            setLinkedProperties([]);
        }
    }, [contact, firestore, user]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Ficha de Contato - ${contact?.name}`,
    });

    const badgeInfo = contact?.type === 'owner' ? { label: 'Proprietário', variant: 'outline' }
        : contact?.type === 'client' ? { label: 'Cliente', variant: 'secondary' }
        : { label: 'Inquilino', variant: 'secondary' };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Contatos
                </Button>
                <Button onClick={handlePrint} variant="ghost" size="icon">
                    <FileDown className="h-5 w-5" />
                    <span className="sr-only">Exportar para PDF</span>
                </Button>
            </div>
             {isContactLoading ? <ContactDetailSkeleton /> : !contact ? (
                <Card className="text-center p-8">
                    <p>Contato não encontrado.</p>
                </Card>
            ) : (
                <div ref={printRef}>
                    <Card id="contact-sheet">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-primary text-2xl font-bold">
                                    {contact.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-2xl font-bold font-headline">{contact.name}</CardTitle>
                                        <Badge variant={badgeInfo.variant as any}>{badgeInfo.label}</Badge>
                                    </div>
                                    <CardDescription>
                                        ID do Contato: {contact.id}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Separator />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <DetailItem icon={<Mail className="w-4 h-4"/>} label="Email" value={contact.email} />
                                <DetailItem icon={<Phone className="w-4 h-4"/>} label="Telefone" value={contact.phone} />
                                <DetailItem icon={<Hash className="w-4 h-4"/>} label="CPF" value={contact.cpf} />
                                <DetailItem icon={<Calendar className="w-4 h-4"/>} label="Idade" value={contact.age} />
                            </div>
                            <Separator />
                             <DetailItem icon={<StickyNote className="w-4 h-4"/>} label="Anotações" value={contact.notes} />
                            
                            {linkedProperties.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><Home className="w-4 h-4"/>Imóveis Vinculados</h4>
                                        <div className="space-y-2">
                                            {linkedProperties.map(prop => (
                                                <Link key={prop.id} href={`/imoveis/editar-imovel/${prop.id}`}>
                                                   <div className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                        <p className="font-semibold">{prop.title}</p>
                                                        <p className="text-xs text-muted-foreground">{prop.neighborhood}, {prop.city}</p>
                                                   </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
