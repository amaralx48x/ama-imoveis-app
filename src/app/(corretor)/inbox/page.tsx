
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { Lead } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Inbox, Archive, Check, AlertTriangle, Trash2, Loader2, ArchiveRestore, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnimatePresence, motion } from "framer-motion";

type LeadWithId = Lead & { id: string };

function LeadCard({ 
    lead, 
    onUpdate,
    onDelete,
    isProcessingId
}: { 
    lead: LeadWithId, 
    onUpdate: (id: string, newStatus: Lead['status']) => void,
    onDelete: (id: string) => void,
    isProcessingId: string | null,
}) {
    const createdAt = lead.createdAt?.toDate ? format(lead.createdAt.toDate(), "d MMM, yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível';
    const isProcessing = isProcessingId === lead.id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
        >
            <Card className={`transition-all hover:shadow-md ${lead.status === 'unread' ? 'bg-primary/5 border-primary/40' : 'bg-card'}`}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-4">
                                <h4 className="font-bold text-lg">{lead.name}</h4>
                                <div className="flex gap-2">
                                  {lead.status === 'unread' && <Badge variant="default">Nova</Badge>}
                                  {lead.status === 'archived' && <Badge variant="secondary">Arquivada</Badge>}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                            <p className="text-md pt-2">{lead.message}</p>
                            {lead.propertyId && <p className="text-xs text-muted-foreground pt-2">Interesse no imóvel ID: {lead.propertyId}</p>}
                            <span className="text-xs text-muted-foreground">{createdAt}</span>
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t">
                        {lead.status === 'unread' && (
                            <Button size="sm" variant="outline" onClick={() => onUpdate(lead.id, 'read')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Eye className="mr-2 h-4 w-4" />}
                                Marcar Lido
                            </Button>
                        )}
                         {lead.status === 'read' && (
                            <Button size="sm" variant="outline" onClick={() => onUpdate(lead.id, 'unread')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <EyeOff className="mr-2 h-4 w-4" />}
                                Marcar Não Lido
                            </Button>
                        )}
                        {lead.status !== 'archived' ? (
                            <Button size="sm" variant="ghost" onClick={() => onUpdate(lead.id, 'archived')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Archive className="mr-2 h-4 w-4" />}
                                Arquivar
                            </Button>
                        ) : (
                             <Button size="sm" variant="ghost" onClick={() => onUpdate(lead.id, 'read')} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArchiveRestore className="mr-2 h-4 w-4" />}
                                Desarquivar
                            </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => onDelete(lead.id)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />} 
                            Remover
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function InboxPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [allLeads, setAllLeads] = useState<LeadWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'unread' | 'all' | 'archived'>('unread');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !firestore) return;

        setLoading(true);
        const leadsCollection = collection(firestore, `agents/${user.uid}/leads`);
        const q = query(leadsCollection, orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const fetchedLeads = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as LeadWithId);
                setAllLeads(fetchedLeads);
                setLoading(false);
                setError(null);
            },
            (err: any) => {
                console.error("Firestore onSnapshot Error:", err);
                setError('Erro ao carregar mensagens. A coleção pode não existir ou você não tem permissão.');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, firestore]);

    const handleUpdate = async (id: string, newStatus: Lead['status']) => {
        if (!user || !firestore) return;
        setProcessingId(id);
        
        const ref = doc(firestore, 'agents', user.uid, 'leads', id);
        try {
            const docSnap = await getDoc(ref);
            if (!docSnap.exists()) {
                 toast({ title: "A mensagem não existe mais", description: "Ela pode ter sido excluída.", variant: "destructive" });
                 return;
            }
            await updateDoc(ref, { status: newStatus });
            toast({ title: `Mensagem atualizada com sucesso!` });
        } catch (err: any) {
            console.error("Erro ao atualizar status:", err);
            toast({ title: "Erro ao atualizar", description: err.message || "Ocorreu um problema.", variant: "destructive" });
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
        const ref = doc(firestore, 'agents', user.uid, 'leads', id);
        try {
            await deleteDoc(ref);
            toast({ title: "Mensagem removida com sucesso!" });
            // onSnapshot will handle the UI update automatically
        } catch (err: any) {
            console.error("Erro ao remover a mensagem:", err);
            toast({ title: "Erro ao remover a mensagem", description: err.message, variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };
    
    const filteredLeads = useMemo(() => {
        if (activeTab === 'unread') return allLeads.filter(l => l.status === 'unread');
        if (activeTab === 'archived') return allLeads.filter(l => l.status === 'archived');
        // 'all' should show everything that is NOT archived
        return allLeads.filter(l => l.status !== 'archived');
    }, [allLeads, activeTab]);

    const unreadLeadsCount = useMemo(() => allLeads.filter(l => l.status === 'unread').length, [allLeads]);

    const renderLeadList = (leadList: LeadWithId[], emptyMessage: string) => {
        if (loading) {
            return (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                </div>
            )
        }
         if (error) {
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )
        }

        if (leadList.length === 0) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="text-center py-16 rounded-lg border-2 border-dashed">
                        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h2 className="text-2xl font-bold mt-4">{emptyMessage}</h2>
                        <p className="text-muted-foreground mt-2">
                           Novas mensagens de clientes aparecerão aqui.
                        </p>
                    </div>
                </motion.div>
            );
        }

        return (
            <div className="space-y-4">
              <AnimatePresence>
                {leadList.map(lead => (
                    <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        onUpdate={handleUpdate} 
                        onDelete={handleDelete}
                        isProcessingId={processingId}
                    />
                ))}
              </AnimatePresence>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Mail /> Caixa de Entrada
                    </CardTitle>
                    {!loading && unreadLeadsCount > 0 && <Badge>{unreadLeadsCount} Nova(s)</Badge>}
                </div>
                <CardDescription>
                    Gerencie as mensagens e contatos recebidos através do seu site.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList>
                        <TabsTrigger value="unread">Não Lidas</TabsTrigger>
                        <TabsTrigger value="all">Caixa de Entrada</TabsTrigger>
                        <TabsTrigger value="archived">Arquivadas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="unread" className="mt-6">
                        {renderLeadList(filteredLeads, 'Nenhuma mensagem nova')}
                    </TabsContent>
                    <TabsContent value="all" className="mt-6">
                         {renderLeadList(filteredLeads, 'Nenhuma mensagem para exibir')}
                    </TabsContent>
                    <TabsContent value="archived" className="mt-6">
                         {renderLeadList(filteredLeads, 'Nenhuma mensagem arquivada')}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
