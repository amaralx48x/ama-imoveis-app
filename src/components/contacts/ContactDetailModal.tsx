'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Contact, Property } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, Mail, Phone, Calendar, Hash, StickyNote, FileDown, Home } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useReactToPrint } from 'react-to-print';
import { Skeleton } from '../ui/skeleton';

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
    )
}

interface ContactDetailModalProps {
    contact: Contact;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Helper function to split an array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunkedArr: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
}


export function ContactDetailModal({ contact, open, onOpenChange }: ContactDetailModalProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const printRef = useRef<HTMLDivElement>(null);

    const [linkedProperties, setLinkedProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;

        async function fetchProperties() {
            setLoading(true);
            if (!contact?.linkedPropertyIds || contact.linkedPropertyIds.length === 0 || !firestore || !user) {
                setLinkedProperties([]);
                setLoading(false);
                return;
            }
            
            try {
                const propertyIds = contact.linkedPropertyIds;
                const propsRef = collection(firestore, `agents/${user.uid}/properties`);
                const allFetchedProperties: Property[] = [];

                // Firestore 'in' query has a limit of 30 elements. Chunk the requests.
                const idChunks = chunkArray(propertyIds, 30);

                for (const chunk of idChunks) {
                    const q = query(propsRef, where('id', 'in', chunk));
                    const snapshot = await getDocs(q);
                    const props = snapshot.docs.map(d => d.data() as Property);
                    allFetchedProperties.push(...props);
                }
                
                setLinkedProperties(allFetchedProperties);
            } catch (error) {
                console.error("Failed to fetch linked properties:", error);
                setLinkedProperties([]); // Clear on error
            } finally {
                setLoading(false);
            }
        }
        
        fetchProperties();
    }, [contact, firestore, user, open]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Ficha de Contato - ${contact?.name}`,
    });

    const badgeInfo = contact?.type === 'owner' ? { label: 'Proprietário', variant: 'outline' }
        : contact?.type === 'client' ? { label: 'Cliente', variant: 'secondary' }
        : { label: 'Inquilino', variant: 'secondary' };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                 <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span className="text-2xl font-bold">Ficha de Contato</span>
                         <div onClick={handlePrint} className="cursor-pointer">
                            <Button variant="ghost" size="icon">
                                <FileDown className="h-5 w-5" />
                                <span className="sr-only">Exportar para PDF</span>
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div ref={printRef} className="printable-content p-1">
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
                            
                            <DetailItem icon={<StickyNote className="w-4 h-4"/>} label="Anotações" value={contact.notes} />
                            
                            {loading ? (
                                <div className="space-y-2 pt-4">
                                    <Skeleton className="h-4 w-1/3 mb-2" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : linkedProperties.length > 0 ? (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-2"><Home className="w-4 h-4"/>Imóveis Vinculados ({linkedProperties.length})</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                            {linkedProperties.map(prop => (
                                                <Link key={prop.id} href={`/imoveis/editar-imovel/${prop.id}`} className="block">
                                                   <div className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                                                        <p className="font-semibold">{prop.title}</p>
                                                        <p className="text-xs text-muted-foreground">{prop.neighborhood}, {prop.city}</p>
                                                   </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
