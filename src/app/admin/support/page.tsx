'use client';

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { useFirestore, useUser, useMemoFirebase } from "@/firebase";
import type { SupportMessage } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Send, Loader2, LifeBuoy } from "lucide-react";


export default function AdminSupportPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [response, setResponse] = useState<Record<string, string>>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    const supportCollection = useMemoFirebase(
        () => (firestore ? collection(firestore, `supportMessages`) : null),
        [firestore]
    );

    useEffect(() => {
        if (!supportCollection) return;
        
        const q = query(supportCollection, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportMessage));
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error(error);
            toast({ title: 'Erro ao carregar mensagens', variant: 'destructive' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [supportCollection, toast]);

    const handleResponseChange = (id: string, text: string) => {
        setResponse(prev => ({ ...prev, [id]: text }));
    };

    const handleRespond = async (id: string) => {
        if (!user || !firestore || !response[id]?.trim()) return;

        setSubmittingId(id);
        const docRef = doc(firestore, 'supportMessages', id);

        try {
            await updateDoc(docRef, {
                status: 'responded',
                responseMessage: response[id],
                respondedBy: user.uid,
                responseAt: serverTimestamp(),
            });
            toast({ title: "Resposta enviada com sucesso!" });
            setResponse(prev => ({...prev, [id]: ''}));
        } catch(err) {
            console.error(err);
            toast({ title: 'Erro ao enviar resposta', variant: 'destructive' });
        } finally {
            setSubmittingId(null);
        }
    };
    
    const formatDate = (timestamp: any) => {
        if (!timestamp?.toDate) return 'Data indisponível';
        return format(timestamp.toDate(), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
    }

    if (loading) {
        return <p>Carregando mensagens de suporte...</p>
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><LifeBuoy/> Painel de Suporte</CardTitle>
                <CardDescription>Visualize e responda os tickets de suporte enviados pelos corretores.</CardDescription>
                </CardHeader>
            </Card>

            <Accordion type="multiple" className="w-full space-y-4">
                {messages.map(msg => (
                    <AccordionItem key={msg.id} value={msg.id} className="border rounded-lg bg-card overflow-hidden">
                        <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:bg-muted/50">
                            <div className="flex justify-between items-center w-full">
                                <div className="text-left">
                                    <p className="font-semibold">{msg.senderName}</p>
                                    <p className="text-sm text-muted-foreground">{msg.senderEmail}</p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                     <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                                    <Badge variant={msg.status === 'pending' ? 'default' : 'secondary'}>
                                        {msg.status === 'pending' ? 'Pendente' : 'Respondido'}
                                    </Badge>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                            <div className="space-y-4">
                                <p className="text-muted-foreground whitespace-pre-wrap pt-4 border-t">{msg.message}</p>
                                {msg.images && msg.images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {msg.images.map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                                <Image src={url} alt={`Anexo ${i+1}`} width={200} height={200} className="rounded-md object-cover aspect-square hover:opacity-80 transition-opacity"/>
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <div className="border-t pt-4 space-y-2">
                                    {msg.status === 'responded' ? (
                                        <div>
                                            <p className="font-semibold text-sm mb-2">Sua Resposta:</p>
                                            <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{msg.responseMessage}</p>
                                             <p className="text-xs text-muted-foreground mt-2">Respondido em {formatDate(msg.responseAt)}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Textarea
                                                placeholder="Digite sua resposta aqui..."
                                                value={response[msg.id] || ''}
                                                onChange={(e) => handleResponseChange(msg.id, e.target.value)}
                                            />
                                            <Button onClick={() => handleRespond(msg.id)} disabled={!response[msg.id]?.trim() || submittingId === msg.id}>
                                                {submittingId === msg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                                                Enviar Resposta
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
             {messages.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhuma mensagem de suporte encontrada.</p>}
        </div>
    );
}
