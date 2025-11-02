
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Home, FileText, MoreVertical } from 'lucide-react';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Agent, Property } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameMonth } from 'date-fns';
import { MonthlyPerformanceChart } from '@/components/dashboard/monthly-chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManualCommissionDialog } from '@/components/dashboard/manual-commission-dialog';


const MotionCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`transition-all duration-500 ease-out hover:scale-105 hover:shadow-primary/20 ${className}`}>
        {children}
    </div>
);

export default function DashboardPage() {
    const [greeting, setGreeting] = useState('');
    const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();

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
    }, []);

    const displayName = agentData?.displayName?.split(' ')[0] || 'Corretor(a)';

    const activePropertiesCount = properties?.filter(p => p.status !== 'vendido' && p.status !== 'alugado').length || 0;

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

    const isLoading = isAgentLoading || arePropertiesLoading;

    return (
        <>
        <div className="space-y-8">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold font-headline">
                    {greeting}, <span className="text-gradient">{isLoading ? <Skeleton className="h-8 w-32 inline-block" /> : displayName}</span>!
                </h1>
                <p className="text-muted-foreground">Aqui está um resumo da sua atividade hoje.</p>
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
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <>
                                    <Skeleton className="h-10 w-40 mb-2" />
                                    <Skeleton className="h-3 w-32" />
                                </>
                             ) : (
                                <>
                                    <div className="text-4xl font-bold">
                                        {commissionsThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
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
            
            <MonthlyPerformanceChart properties={properties || []} isLoading={isLoading} />
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
