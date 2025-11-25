
'use client';

import { useEffect, useState } from "react";
import { collection, query, onSnapshot, doc, setDoc, serverTimestamp, orderBy } from "firebase/firestore";
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
import { Send, Loader2, LifeBuoy, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function AdminSupportPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            setError(null);
            setLoading(false);
        }, (err) => {
            console.error("Firebase Snapshot Error:", err);
            if (err.code === 'permission-denied') {
                setError("Você não tem permissão para visualizar esta página. Apenas administradores podem ver os tickets de suporte.");
            } else {
                setError("Ocorreu um erro ao carregar as mensagens de suporte.");
            }
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
        const responseData = {
            status: 'responded',
            responseMessage: response[id],
            respondedBy: user.uid,
            responseAt: serverTimestamp(),
        };

        try {
            await setDoc(docRef, responseData, { merge: true });
            toast({ title: "Resposta enviada com sucesso!" });
            setResponse(prev => ({...prev, [id]: ''}));
        } catch(err: any) {
            console.error("Error updating document: ", err);
            toast({
                title: "Erro ao enviar resposta",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSubmittingId(null);
        }
    };
    
    const formatDate = (timestamp: any) => {
        if (!timestamp?.toDate) return 'Data indisponível';
        return format(timestamp.toDate(), "d 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR });
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Carregando mensagens...</span></div>
    }

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><LifeBuoy/> Painel de Suporte</CardTitle>
                <CardDescription>Visualize e responda os tickets de suporte enviados pelos corretores.</CardDescription>
                </CardHeader>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Acesso Negado</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!error && (
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
            )}
             {!loading && !error && messages.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhuma mensagem de suporte encontrada.</p>}
        </div>
    );
}
