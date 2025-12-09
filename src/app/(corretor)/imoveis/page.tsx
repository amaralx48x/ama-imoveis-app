
'use client';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, AlertTriangle, Upload, Trash2, Search, Gem, MoreHorizontal } from 'lucide-react';
import { PropertyCard } from '@/components/property-card';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import type { Property } from '@/lib/data';
import { collection, query, where, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { usePlan } from '@/context/PlanContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InfoCard } from '@/components/info-card';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';


function PropertyList({ 
    properties, 
    isLoading, 
    error,
    onDelete, 
    onStatusChange,
    emptyStateTitle,
    emptyStateDescription,
    selectedIds,
    onToggleSelect
}: {
    properties: Property[] | null,
    isLoading: boolean,
    error: Error | null,
    onDelete: (id: string) => void,
    onStatusChange: () => void,
    emptyStateTitle: string,
    emptyStateDescription: string,
    selectedIds: Record<string, boolean>,
    onToggleSelect: (id: string) => void,
}) {
     if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[224px] w-full rounded-xl" />
                    <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro ao Carregar Imóveis</AlertTitle>
                <AlertDescription>
                    Não foi possível buscar seus imóveis no momento. Verifique sua conexão ou tente novamente mais tarde.
                </AlertDescription>
            </Alert>
        )
    }

    if (properties && properties.length === 0) {
        return (
            <div className="text-center py-16 rounded-lg border-2 border-dashed mt-6">
                <h2 className="text-2xl font-bold mb-2">{emptyStateTitle}</h2>
                <p className="text-muted-foreground mb-4">{emptyStateDescription}</p>
                 {emptyStateTitle.includes("Nenhum imóvel ativo") && (
                     <>
                        <Button asChild>
                            <Link href="/imoveis/novo">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Primeiro Imóvel
                            </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground mt-3">Fique tranquilo, ao adicionar seu primeiro imóvel, os exemplos do seu site público não aparecerão mais.</p>
                     </>
                 )}
            </div>
        )
    }

    return (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
            {properties && properties.map((property) => (
                <div key={property.id} className="relative">
                    <PropertyCard property={property} onDelete={onDelete} onStatusChange={onStatusChange} />
                    <div className="absolute top-2 left-2 z-10 bg-background/50 rounded-full">
                        <Checkbox
                            checked={!!selectedIds[property.id]}
                            onCheckedChange={() => onToggleSelect(property.id)}
                            className="m-1 h-5 w-5"
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function ImoveisPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const { limits, canAddNewProperty, currentPropertiesCount } = usePlan();
    const [activeTab, setActiveTab] = useState<'ativo' | 'vendido' | 'alugado'>('ativo');
    const [searchTerm, setSearchTerm] = useState('');
    const [needsRefetch, setNeedsRefetch] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

    const propertiesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        
        let q = query(collection(firestore, `agents/${user.uid}/properties`));

        if (activeTab === 'ativo') {
            q = query(q, where('status', 'in', ['ativo', null]));
        } else {
            q = query(q, where('status', '==', activeTab));
        }
        return q;
    }, [firestore, user, activeTab, needsRefetch]);

    const { data: properties, isLoading, error, mutate } = useCollection<Property>(propertiesQuery);
    
    const filteredProperties = useMemo(() => {
        if (!properties) return [];
        if (!searchTerm) return properties;

        const lowercasedTerm = searchTerm.toLowerCase();
        return properties.filter(property => 
            (property.title?.toLowerCase() ?? '').includes(lowercasedTerm) ||
            (property.city?.toLowerCase() ?? '').includes(lowercasedTerm) ||
            (property.neighborhood?.toLowerCase() ?? '').includes(lowercasedTerm)
        );
    }, [properties, searchTerm]);

    
    const handleDeleteProperty = async (id: string) => {
        if (!firestore || !user) return;
        if (!window.confirm("Tem certeza que deseja excluir este imóvel? Esta ação não pode ser desfeita.")) return;

        const docRef = doc(firestore, `agents/${user.uid}/properties`, id);
        
        try {
            await deleteDoc(docRef);
            mutate();
            toast({ title: 'Imóvel excluído com sucesso!' });
        } catch (error) {
            console.error("Erro ao excluir imóvel: ", error);
            toast({ title: 'Erro ao excluir', variant: 'destructive' });
        }
    };

    const handleBulkDelete = async () => {
        const idsToDelete = Object.keys(selectedIds).filter(id => selectedIds[id]);
        if (idsToDelete.length === 0) {
            toast({ title: "Nenhum imóvel selecionado", variant: "destructive" });
            return;
        }
        if (!window.confirm(`Tem certeza que deseja excluir ${idsToDelete.length} imóvel(is)?`)) return;
        if (!firestore || !user) return;

        const batch = writeBatch(firestore);
        idsToDelete.forEach(id => {
            const docRef = doc(firestore, `agents/${user.uid}/properties`, id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
            mutate();
            setSelectedIds({});
            toast({ title: `${idsToDelete.length} imóvel(is) excluído(s) com sucesso!` });
        } catch (error) {
            console.error("Erro ao excluir imóveis em massa:", error);
            toast({ title: 'Erro ao excluir imóveis', variant: 'destructive' });
        }
    };
    
    const handleStatusChange = () => {
        mutate();
        setNeedsRefetch(prev => !prev);
    }
    
    const handleImportClick = () => {
        if (limits.canImportCSV) {
            router.push('/imoveis/importar');
        } else {
            setIsUpgradeModalOpen(true);
        }
    }
    
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    
    const numSelected = Object.keys(selectedIds).filter(id => selectedIds[id]).length;
    const canAdd = canAddNewProperty();

    return (
        <div className="space-y-8">
            <InfoCard cardId="meus-imoveis-info" title="Gerencie seu Portfólio">
                <p>
                    Aqui você pode adicionar, editar e visualizar todos os seus imóveis. Use as abas para ver os imóveis <strong>Ativos</strong>, <strong>Vendidos</strong> ou <strong>Alugados</strong>.
                </p>
                <p>
                    <strong>Dica:</strong> No menu de cada imóvel (três pontinhos), você pode marcá-lo como vendido/alugado, o que o moverá para a aba correspondente e atualizará suas métricas no Dashboard.
                </p>
            </InfoCard>

            <div className="flex justify-between items-center animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Meus Imóveis ({currentPropertiesCount} / {limits.maxProperties})</h1>
                    <p className="text-muted-foreground">Gerencie seu portfólio de imóveis.</p>
                </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar
                    </Button>
                    
                     <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-primary">
                                    <Gem /> Recurso Exclusivo de Planos Superiores
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    A importação de imóveis (CSV ou XML) é uma ferramenta poderosa para economizar seu tempo. Faça o upgrade do seu plano para desbloquear este e outros benefícios.
                                </DialogDescription>
                            </DialogHeader>
                            <Button asChild onClick={() => setIsUpgradeModalOpen(false)}>
                                <Link href="/meu-plano">Conhecer Planos e Fazer Upgrade</Link>
                            </Button>
                        </DialogContent>
                     </Dialog>

                    <Button asChild className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity" disabled={!canAdd}>
                        <Link href={canAdd ? "/imoveis/novo" : "#"}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Imóvel
                        </Link>
                    </Button>
                    {!canAdd && (
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                                     <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Imóvel
                                </Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-destructive">Limite de Imóveis Atingido!</DialogTitle>
                                    <DialogDescription className="pt-2">
                                         Você atingiu o limite de {limits.maxProperties} imóveis para o seu plano atual. Para continuar adicionando, por favor, faça o upgrade do seu plano.
                                    </DialogDescription>
                                </DialogHeader>
                                <Button asChild>
                                    <Link href="/meu-plano">Fazer Upgrade</Link>
                                </Button>
                            </DialogContent>
                         </Dialog>
                    )}
                </div>
            </div>
            
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por título, cidade ou bairro..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {numSelected > 0 && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md border">
                    <span className="text-sm font-medium">{numSelected} selecionado(s)</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Ações em Massa <MoreHorizontal className="ml-2 h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Selecionados
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="ativo">Ativos</TabsTrigger>
                    <TabsTrigger value="vendido">Vendidos</TabsTrigger>
                    <TabsTrigger value="alugado">Alugados</TabsTrigger>
                </TabsList>
                <TabsContent value="ativo">
                    <PropertyList 
                        properties={filteredProperties}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleDeleteProperty}
                        onStatusChange={handleStatusChange}
                        emptyStateTitle="Nenhum imóvel ativo encontrado"
                        emptyStateDescription={searchTerm ? "Tente uma busca diferente." : "Que tal adicionar seu primeiro imóvel agora?"}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                    />
                </TabsContent>
                <TabsContent value="vendido">
                     <PropertyList 
                        properties={filteredProperties}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleDeleteProperty}
                        onStatusChange={handleStatusChange}
                        emptyStateTitle="Nenhum imóvel vendido"
                        emptyStateDescription="Imóveis marcados como 'vendido' aparecerão aqui."
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                    />
                </TabsContent>
                <TabsContent value="alugado">
                     <PropertyList 
                        properties={filteredProperties}
                        isLoading={isLoading}
                        error={error}
                        onDelete={handleDeleteProperty}
                        onStatusChange={handleStatusChange}
                        emptyStateTitle="Nenhum imóvel alugado"
                        emptyStateDescription="Imóveis marcados como 'alugado' aparecerão aqui."
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                    />
                </TabsContent>
            </Tabs>

        </div>
    );
}
