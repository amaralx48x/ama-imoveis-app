'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Home, FileText, MoreVertical, PlusCircle, Mail, User, Palette, Link as LinkIcon, Settings, Star, Briefcase, Users, Rss, LifeBuoy, Gem, Folder, Search, Percent, LogOut } from 'lucide-react';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Agent, Property, SubUser } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameMonth } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManualCommissionDialog } from '@/components/dashboard/manual-commission-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoCard } from '@/components/info-card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


const MotionCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`transition-all duration-500 ease-out hover:scale-105 hover:shadow-primary/20 ${className}`}>
        {children}
    </div>
);

function formatCurrency(value: number): string {
    if (value >= 100000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const allShortcuts = [
    { id: 'add-property', href: '/imoveis/novo?from=dashboard', icon: PlusCircle, title: 'Adicionar Imóvel', description: 'Cadastre um novo imóvel no seu portfólio.', permission: true },
    { id: 'view-leads', href: '/inbox?from=dashboard', icon: Mail, title: 'Ver Leads', description: 'Acesse sua caixa de entrada de novos contatos.', permission: true },
    { id: 'add-contact', href: '/contatos?from=dashboard', icon: Users, title: 'Adicionar Contato', description: 'Gerencie sua agenda de clientes e proprietários.', permission: true },
    { id: 'customize-site', href: '/configuracoes/aparencia', icon: Palette, title: 'Personalizar Site', description: 'Altere o tema e a aparência da sua página pública.', permission: (level: any) => level === 'owner' || level === '3' },
    { id: 'manage-reviews', href: '/avaliacoes', icon: Star, title: 'Gerenciar Avaliações', description: 'Aprove ou remova avaliações de clientes.', permission: true },
    { id: 'manage-properties', href: '/imoveis', icon: Briefcase, title: 'Ver Meus Imóveis', description: 'Visualize e edite seu portfólio de imóveis.', permission: true },
    { id: 'integrations', href: '/integracoes', icon: Rss, title: 'Integrações', description: 'Configure feeds XML para portais imobiliários.', permission: (level: any) => level === 'owner' || level === '3' || level === '2' },
    { id: 'support', href: '/suporte', icon: LifeBuoy, title: 'Suporte', description: 'Tire dúvidas ou reporte problemas.', permission: true },
    { id: 'my-plan', href: '/meu-plano', icon: Gem, title: 'Meu Plano', description: 'Gerencie sua assinatura e limites.', permission: (level: any) => level === 'owner' },
    { id: 'manage-sections', href: '/configuracoes/secoes', icon: Folder, title: 'Gerenciar Seções', description: 'Crie seções personalizadas para seu site.', permission: true },
    { id: 'seo-settings', href: '/configuracoes/seo', icon: Search, title: 'Configurar SEO', description: 'Otimize seu site para buscas.', permission: (level: any) => level === 'owner' || level === '3' },
    { id: 'commission-settings', href: '/configuracoes/metricas', icon: Percent, title: 'Métricas de Comissão', description: 'Defina suas comissões padrão.', permission: (level: any) => level === 'owner' || level === '3' || level === '2' },
];

const defaultShortcutIds = ['add-property', 'view-leads', 'add-contact', 'customize-site'];

function QuickShortcuts({ currentUserLevel }: {currentUserLevel: SubUser['level'] | 'owner' | null}) {
    const { toast } = useToast();
    const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>([]);
    
    useEffect(() => {
        try {
            const savedShortcuts = localStorage.getItem('dashboard-shortcuts');
            if (savedShortcuts) {
                setSelectedShortcuts(JSON.parse(savedShortcuts));
            } else {
                setSelectedShortcuts(defaultShortcutIds);
            }
        } catch (error) {
            console.error("Failed to parse shortcuts from localStorage", error);
            setSelectedShortcuts(defaultShortcutIds);
        }
    }, []);

    const handleSelectionChange = (shortcutId: string) => {
        const newSelection = selectedShortcuts.includes(shortcutId)
            ? selectedShortcuts.filter(id => id !== shortcutId)
            : [...selectedShortcuts, shortcutId];

        if (newSelection.length > 12) {
             toast({
                title: "Limite de atalhos atingido",
                description: "Você pode selecionar no máximo 12 atalhos.",
                variant: "destructive"
            });
            return;
        }
        
        setSelectedShortcuts(newSelection);
        localStorage.setItem('dashboard-shortcuts', JSON.stringify(newSelection));
    };
    
    const hasPermission = (permission: any) => {
        if (typeof permission === 'boolean') return permission;
        if (typeof permission === 'function') return permission(currentUserLevel);
        return false;
    }

    const displayedShortcuts = allShortcuts.filter(s => selectedShortcuts.includes(s.id));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">Atalhos Rápidos</CardTitle>
                    <CardDescription>Acesse rapidamente as funções mais importantes do seu dia a dia.</CardDescription>
                </div>
                 <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Personalizar atalhos</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Personalizar Atalhos</DialogTitle>
                            <DialogDescription>
                                Selecione até 12 atalhos para exibir no seu dashboard. As alterações são salvas automaticamente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 max-h-[50vh] overflow-y-auto">
                            {allShortcuts.map(shortcut => (
                                <div key={shortcut.id} className="flex items-center space-x-2 p-3 border rounded-md">
                                    <Checkbox
                                        id={`shortcut-${shortcut.id}`}
                                        checked={selectedShortcuts.includes(shortcut.id)}
                                        onCheckedChange={() => handleSelectionChange(shortcut.id)}
                                    />
                                    <Label htmlFor={`shortcut-${shortcut.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                        {shortcut.title}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {displayedShortcuts.map((link, index) => {
                    const permitted = hasPermission(link.permission);
                    const Wrapper = permitted ? Link : 'div';
                     return (
                        <motion.div key={link.href}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Wrapper href={permitted ? link.href : '#'} className={`block h-full ${!permitted ? 'cursor-not-allowed opacity-50' : ''}`}>
                                            <Card className="h-full hover:bg-muted/50 hover:border-primary/50 transition-colors flex flex-col">
                                                <CardHeader className="flex-row items-center gap-4 space-y-0">
                                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                        <link.icon className="h-6 w-6" />
                                                    </div>
                                                    <CardTitle className="text-lg font-semibold">{link.title}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex-grow">
                                                    <p className="text-sm text-muted-foreground">{link.description}</p>
                                                </CardContent>
                                            </Card>
                                        </Wrapper>
                                    </TooltipTrigger>
                                    {!permitted && (
                                        <TooltipContent>
                                            <p>Seu usuário não tem acesso</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        </motion.div>
                    )
                })}
            </CardContent>
        </Card>
    )
}


export default function DashboardPage() {
    const router = useRouter();
    const [greeting, setGreeting] = useState('');
    const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
    const [currentUserLevel, setCurrentUserLevel] = useState<SubUser['level'] | 'owner' | null>(null);
    const [currentUserName, setCurrentUserName] = useState<string>('');
    
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const agentRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
        [firestore, user]
    );
    const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);

    const propertiesCollection = useMemoFirebase(
        () => (firestore && user ? collection(firestore, `agents/${user.uid}/properties`) : null),
        [firestore, user]
    );
    const { data: properties, isLoading: arePropertiesLoading } = useCollection<Property>(propertiesCollection);

    useEffect(() => {
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) return "Bom dia";
            if (hour < 18) return "Boa tarde";
            return "Boa noite";
        }
        setGreeting(getGreeting());

        if (typeof window !== 'undefined' && agentData) {
            const subUserId = sessionStorage.getItem('subUserId');
            if (subUserId === agentData.id) {
                setCurrentUserLevel('owner');
                setCurrentUserName(agentData.displayName?.split(' ')[0] || 'Dono');
            } else {
                const subUser = agentData.subUsers?.find(u => u.id === subUserId);
                setCurrentUserLevel(subUser?.level || null);
                setCurrentUserName(subUser?.name?.split(' ')[0] || 'Usuário');
            }
        }
    }, [agentData]);

    const handleSwitchUser = () => {
        sessionStorage.removeItem('subUserId');
        router.push('/selecao-usuario');
    }

    const commissionsThisMonth = properties
        ?.filter(p => {
            if (!['vendido', 'alugado'].includes(p.status || '') || !p.soldAt) return false;
            
            const soldDate = p.soldAt.toDate();
            return isSameMonth(soldDate, new Date());
        })
        .reduce((sum, p) => sum + (p.commissionValue || 0), 0) || 0;
    
    const dealsThisMonthCount = properties
        ?.filter(p => {
            if (!['vendido', 'alugado'].includes(p.status || '') || !p.soldAt) return false;
            const soldDate = p.soldAt.toDate();
            return isSameMonth(soldDate, new Date());
        }).length || 0;

    const isLoading = isUserLoading || isAgentLoading || arePropertiesLoading;
    const activePropertiesCount = properties?.filter(p => p.status === 'ativo' || p.status === null).length || 0;

    if (isLoading || !user) {
        return <p>Carregando...</p>;
    }

    return (
        <>
        <div className="space-y-8">
             <InfoCard cardId="dashboard-welcome" title={`Bem-vindo(a) ao seu Painel, ${currentUserName}!`}>
                <p>
                    Este é o seu centro de comando. Acompanhe as métricas mais importantes do seu negócio e utilize os atalhos rápidos para agilizar suas tarefas diárias.
                </p>
                <p>
                    Use o menu à esquerda para navegar entre as funcionalidades, como gerenciar seus imóveis, leads e configurar seu site público.
                </p>
            </InfoCard>

            <div className="animate-fade-in-up flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline">
                        {greeting}, <span className="text-gradient">{isLoading ? <Skeleton className="h-8 w-32 inline-block" /> : currentUserName}</span>!
                    </h1>
                    <p className="text-muted-foreground">Aqui está um resumo da sua atividade hoje.</p>
                </div>
                <Button variant="outline" onClick={handleSwitchUser}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    Mudar de Usuário
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Imóveis Ativos</CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <>
                                    <Skeleton className="h-10 w-16 mb-2" />
                                    <Skeleton className="h-3 w-24" />
                                </>
                            ) : (
                                <>
                                    <div className="text-4xl font-bold">{activePropertiesCount}</div>
                                    <p className="text-xs text-muted-foreground">Imóveis disponíveis para negócio</p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </MotionCard>
                
                <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Comissões no Mês</CardTitle>
                             {(currentUserLevel === 'owner' || currentUserLevel === '3') && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsCommissionDialogOpen(true)}>
                                            Ajustar valor manualmente
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <>
                                    <Skeleton className="h-10 w-40 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </>
                             ) : (
                                <>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="text-4xl font-bold">
                                                    {formatCurrency(commissionsThisMonth)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{commissionsThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <p className="text-xs text-muted-foreground">Total de comissões no mês atual</p>
                                </>
                             )}
                        </CardContent>
                    </Card>
                </MotionCard>
                
                 <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Imóveis Negociados (Mês)</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <>
                                    <Skeleton className="h-10 w-16 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </>
                            ) : (
                                <>
                                    <div className="text-4xl font-bold">
                                        {dealsThisMonthCount}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Imóveis vendidos ou alugados</p>
                                </>
                             )}
                        </CardContent>
                    </Card>
                </MotionCard>
            </div>
            
            <QuickShortcuts currentUserLevel={currentUserLevel} />

        </div>
        {user && (
            <ManualCommissionDialog
                agentId={user.uid}
                isOpen={isCommissionDialogOpen}
                onOpenChange={setIsCommissionDialogOpen}
            />
        )}
        </>
    );
}
