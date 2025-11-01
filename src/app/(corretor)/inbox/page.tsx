
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import type { Lead } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Inbox, Archive, Check, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type LeadWithId = Lead & { id: string };

function LeadCard({ 
    lead, 
    onStatusChange, 
    onDelete,
    isProcessing 
}: { 
    lead: LeadWithId, 
    onStatusChange: (id: string, status: 'lido' | 'arquivado') => void, 
    onDelete: (id: string) => void,
    isProcessing: boolean,
}) {
    const createdAt = lead.createdAt?.toDate ? format(lead.createdAt.toDate(), "d MMM, yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível';

    return (
        <Card className={`transition-all ${lead.status === 'novo' ? 'bg-primary/5 border-primary/40' : 'bg-card'}`}>
            <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-4">
                            <h4 className="font-bold text-lg">{lead.name}</h4>
                            <Badge variant={lead.status === 'novo' ? 'default' : 'secondary'}>{lead.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                        <p className="text-md pt-2">{lead.message}</p>
                         {lead.propertyId && <p className="text-xs text-muted-foreground pt-2">Interesse no imóvel ID: {lead.propertyId}</p>}
                        <span className="text-xs text-muted-foreground">{createdAt}</span>
                    </div>
                </div>
                 <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t">
                    {lead.status === 'novo' && (
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(lead.id, 'lido')} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />} Marcar como Lido
                        </Button>
                    )}
                    {lead.status !== 'arquivado' && (
                        <Button size="sm" variant="ghost" onClick={() => onStatusChange(lead.id, 'arquivado')} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Archive className="mr-2 h-4 w-4" />} Arquivar
                        </Button>
                    )}
                     <Button size="sm" variant="destructive" onClick={() => onDelete(lead.id)} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />} Remover
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function InboxPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [leads, setLeads] = useState<LeadWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'novo' | 'lido' | 'arquivado'>('novo');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const leadsQuery = useMemoFirebase(
        () => (user && firestore ? query(collection(firestore, 'leads'), where('agentId', '==', user.uid)) : null),
        [user, firestore]
    );

    useEffect(() => {
        if (!leadsQuery) {
            setLoading(false);
            return;
        };

        setLoading(true);
        const unsubscribe = onSnapshot(leadsQuery, 
            (snapshot) => {
                const fetchedLeads = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as LeadWithId);
                
                const sortedLeads = fetchedLeads.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                    return dateB - dateA;
                });
                
                setLeads(sortedLeads);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError('Erro ao carregar mensagens. Você pode precisar criar um índice no Firestore se o erro persistir.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [leadsQuery]);

    const handleStatusChange = async (id: string, status: 'lido' | 'arquivado') => {
        if (!user || !firestore) return;
        setProcessingId(id);
        
        const ref = doc(firestore, 'leads', id);
        try {
            const docSnap = await getDoc(ref);
            if (!docSnap.exists()) {
                 toast({ title: "A mensagem não existe mais", description: "Ela pode ter sido excluída.", variant: "destructive" });
                 return;
            }
            await updateDoc(ref, { status: status });
            toast({ title: `Mensagem movida para '${status}s'!` });
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            toast({ title: "Erro ao atualizar status", description: "Ocorreu um problema ao tentar atualizar a mensagem.", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !firestore) return;

        if (!window.confirm("Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.")) {
            return;
        }

        setProcessingId(id);
        const ref = doc(firestore, 'leads', id);
        try {
            await deleteDoc(ref);
            toast({ title: "Mensagem removida com sucesso!" });
        } catch (err) {
            console.error("Erro ao remover a mensagem:", err);
            toast({ title: "Erro ao remover a mensagem", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };
    
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => lead.status === activeTab);
    }, [leads, activeTab]);

    const renderLeadList = (leadList: LeadWithId[], emptyMessage: string) => {
        if (loading) {
            return (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                       <div key={i} className="flex space-x-4 border rounded-lg p-4">
                           <div className="flex-1 space-y-3">
                               <Skeleton className="h-5 w-1/4" />
                               <Skeleton className="h-4 w-3/4" />
                               <Skeleton className="h-4 w-1/2" />
                           </div>
                           <Skeleton className="h-10 w-24" />
                       </div>
                    ))}
                </div>
            )
        }
         if (error) {
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )
        }

        if (leadList.length === 0) {
            return (
                <div className="text-center py-16 rounded-lg border-2 border-dashed">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="text-2xl font-bold mt-4">{emptyMessage}</h2>
                    <p className="text-muted-foreground mt-2">
                       Novas mensagens de clientes aparecerão aqui.
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {leadList.map(lead => (
                    <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        onStatusChange={handleStatusChange} 
                        onDelete={handleDelete}
                        isProcessing={processingId === lead.id}
                    />
                ))}
            </div>
        );
    }
    
    const newLeadsCount = leads.filter(l => l.status === 'novo').length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Mail /> Caixa de Entrada
                    </CardTitle>
                    {!loading && newLeadsCount > 0 && <Badge>{newLeadsCount} Nova(s)</Badge>}
                </div>
                <CardDescription>
                    Gerencie as mensagens e contatos recebidos através do seu site.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList>
                        <TabsTrigger value="novo">Novas</TabsTrigger>
                        <TabsTrigger value="lido">Lidas</TabsTrigger>
                        <TabsTrigger value="arquivado">Arquivadas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="novo" className="mt-6">
                        {renderLeadList(filteredLeads, 'Nenhuma mensagem nova')}
                    </TabsContent>
                    <TabsContent value="lido" className="mt-6">
                         {renderLeadList(filteredLeads, 'Nenhuma mensagem lida')}
                    </TabsContent>
                    <TabsContent value="arquivado" className="mt-6">
                         {renderLeadList(filteredLeads, 'Nenhuma mensagem arquivada')}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
