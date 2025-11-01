
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { Lead } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Inbox, Archive, Check, AlertTriangle, Trash2, Loader2, ArchiveRestore, Undo2, Eye, EyeOff } from 'lucide-react';
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
    isProcessing 
}: { 
    lead: LeadWithId, 
    onUpdate: (id: string, field: 'lida' | 'arquivada', value: boolean) => void,
    onDelete: (id: string) => void,
    isProcessing: boolean,
}) {
    const createdAt = lead.createdAt?.toDate ? format(lead.createdAt.toDate(), "d MMM, yyyy 'às' HH:mm", { locale: ptBR }) : 'Data indisponível';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <Card className={`transition-all hover:shadow-md ${!lead.lida ? 'bg-primary/5 border-primary/40' : 'bg-card'}`}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-4">
                                <h4 className="font-bold text-lg">{lead.name}</h4>
                                <div className="flex gap-2">
                                  {!lead.lida && <Badge variant="default">Nova</Badge>}
                                  {lead.arquivada && <Badge variant="secondary">Arquivada</Badge>}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{lead.email} {lead.phone && `• ${lead.phone}`}</p>
                            <p className="text-md pt-2">{lead.message}</p>
                            {lead.propertyId && <p className="text-xs text-muted-foreground pt-2">Interesse no imóvel ID: {lead.propertyId}</p>}
                            <span className="text-xs text-muted-foreground">{createdAt}</span>
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t">
                        <Button size="sm" variant="outline" onClick={() => onUpdate(lead.id, 'lida', !lead.lida)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (lead.lida ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />)}
                            {lead.lida ? 'Não Lido' : 'Lido'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onUpdate(lead.id, 'arquivada', !lead.arquivada)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (lead.arquivada ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />)}
                            {lead.arquivada ? 'Desarquivar' : 'Arquivar'}
                        </Button>
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
    const [activeTab, setActiveTab] = useState<'novas' | 'arquivadas' | 'todas'>('novas');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !firestore) return;

        const leadsCollection = collection(firestore, 'leads');
        const q = query(leadsCollection, where('agentId', '==', user.uid), orderBy('createdAt', 'desc'));
        
        setLoading(true);
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const fetchedLeads = snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as LeadWithId);
                setAllLeads(fetchedLeads);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError('Erro ao carregar mensagens. Pode ser necessário criar um índice no Firestore: (leads, agentId, createdAt DESC).');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, firestore]);

    const handleUpdate = async (id: string, field: 'lida' | 'arquivada', value: boolean) => {
        if (!user || !firestore) return;
        setProcessingId(id);
        
        const ref = doc(firestore, 'leads', id);
        try {
            const docSnap = await getDoc(ref);
            if (!docSnap.exists()) {
                 toast({ title: "A mensagem não existe mais", description: "Ela pode ter sido excluída.", variant: "destructive" });
                 return;
            }
            await updateDoc(ref, { [field]: value });
            toast({ title: `Mensagem atualizada!` });
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            toast({ title: "Erro ao atualizar", description: "Ocorreu um problema ao tentar atualizar a mensagem.", variant: "destructive" });
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
        if (activeTab === 'novas') return allLeads.filter(l => !l.lida && !l.arquivada);
        if (activeTab === 'arquivadas') return allLeads.filter(l => l.arquivada);
        return allLeads; // 'todas'
    }, [allLeads, activeTab]);

    const newLeadsCount = useMemo(() => allLeads.filter(l => !l.lida && !l.arquivada).length, [allLeads]);

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
                    <AlertTitle>Erro</AlertTitle>
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
                        isProcessing={processingId === lead.id}
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
                    {!loading && newLeadsCount > 0 && <Badge>{newLeadsCount} Nova(s)</Badge>}
                </div>
                <CardDescription>
                    Gerencie as mensagens e contatos recebidos através do seu site.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                    <TabsList>
                        <TabsTrigger value="novas">Novas</TabsTrigger>
                        <TabsTrigger value="todas">Todas</TabsTrigger>
                        <TabsTrigger value="arquivadas">Arquivadas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="novas" className="mt-6">
                        {renderLeadList(filteredLeads, 'Nenhuma mensagem nova')}
                    </TabsContent>
                    <TabsContent value="todas" className="mt-6">
                         {renderLeadList(filteredLeads, 'Nenhuma mensagem para exibir')}
                    </TabsContent>
                    <TabsContent value="arquivadas" className="mt-6">
                         {renderLeadList(filteredLeads, 'Nenhuma mensagem arquivada')}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
