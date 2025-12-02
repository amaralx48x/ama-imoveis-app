
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import type { Contact, Property, Agent } from '@/lib/data';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Calendar, Hash, StickyNote, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

function PrintPageSkeleton() {
    return (
        <div className="max-w-2xl mx-auto p-8 bg-background">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-px w-full my-4" />
            <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-px w-full my-4" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string | number | null }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunkedArr: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
}

export default function ContactPrintPage() {
    const params = useParams();
    const contactId = params.contactId as string;
    const { user } = useUser();
    const firestore = useFirestore();

    const [contact, setContact] = useState<Contact | null>(null);
    const [linkedProperties, setLinkedProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!contactId || !user?.uid || !firestore) return;

        const fetchPrintData = async () => {
            try {
                const contactRef = doc(firestore, `agents/${user.uid}/contacts`, contactId);
                const contactSnap = await getDoc(contactRef);
                
                if (contactSnap.exists()) {
                    const contactData = contactSnap.data() as Contact;
                    setContact(contactData);
                    
                    if (contactData.linkedPropertyIds && contactData.linkedPropertyIds.length > 0) {
                        const propertyIds = contactData.linkedPropertyIds;
                        const propsRef = collection(firestore, `agents/${user.uid}/properties`);
                        const allFetchedProperties: Property[] = [];
                        const idChunks = chunkArray(propertyIds, 30);

                        for (const chunk of idChunks) {
                            const q = query(propsRef, where('id', 'in', chunk));
                            const snapshot = await getDocs(q);
                            allFetchedProperties.push(...snapshot.docs.map(d => d.data() as Property));
                        }
                        setLinkedProperties(allFetchedProperties);
                    }
                     // Trigger print dialog once data is likely rendered
                    setTimeout(() => window.print(), 500);
                }
            } catch (error) {
                console.error("Error fetching data for printing:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrintData();

    }, [contactId, user, firestore]);

    if (isLoading) {
        return <PrintPageSkeleton />;
    }

    if (!contact) {
        return notFound();
    }

    const badgeInfo = contact.type === 'owner' ? { label: 'Proprietário', variant: 'outline' }
        : contact.type === 'client' ? { label: 'Cliente', variant: 'secondary' }
        : { label: 'Inquilino', variant: 'secondary' };

    return (
        <div className="max-w-2xl mx-auto p-8 bg-background text-foreground">
            <Card id="contact-sheet" className="shadow-none border-none">
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
                            <CardDescription>ID do Contato: {contact.id}</CardDescription>
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
                    <DetailItem icon={<StickyNote className="w-4 h-4"/>} label="Anotações" value={contact.notes} />
                    {linkedProperties.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><Home className="w-4 h-4"/>Imóveis Vinculados ({linkedProperties.length})</h4>
                                <div className="space-y-2">
                                    {linkedProperties.map(prop => (
                                        <div key={prop.id} className="p-3 border rounded-md">
                                            <p className="font-semibold">{prop.title}</p>
                                            <p className="text-xs text-muted-foreground">{prop.neighborhood}, {prop.city}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
