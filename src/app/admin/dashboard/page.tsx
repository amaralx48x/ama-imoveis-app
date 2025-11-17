
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Users, DollarSign, BarChart2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, collectionGroup, getDocs, query } from 'firebase/firestore';
import type { Property, Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyPerformanceChart } from '@/components/dashboard/monthly-chart';
import { Button } from '@/components/ui/button';
import { AgentList } from '@/components/dashboard/agent-list';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const PLAN_PRICES = {
    corretor: 59.90,
    imobiliaria: 89.90,
};

const MotionCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <div className={`transition-all duration-500 ease-out hover:scale-105 hover:shadow-primary/20 ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
        {children}
    </div>
);

function formatCurrency(value: number): string {
    if (value >= 100000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}


export default function AdminDashboardPage() {
    const [viewMode, setViewMode] = useState<'chart' | 'agents'>('chart');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [metrics, setMetrics] = useState({
        totalAgents: 0,
        monthlyRevenue: 0,
        totalActiveProperties: 0,
    });
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        async function fetchMetrics() {
            setIsLoading(true);
            try {
                const agentsCollection = collection(firestore, 'agents');
                const propertiesCollection = collectionGroup(firestore, 'properties');

                const [agentsSnap, propertiesSnap] = await Promise.all([
                    getDocs(agentsCollection),
                    getDocs(propertiesCollection)
                ]);

                const fetchedAgents = agentsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Agent);
                setAgents(fetchedAgents);
                const totalAgents = fetchedAgents.length;
                
                const monthlyRevenue = fetchedAgents.reduce((sum, agent) => {
                    const plan = agent.plan || 'corretor'; // Default to 'corretor' if plan is not set
                    return sum + (PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || 0);
                }, 0);
                
                const uniqueProperties = new Map<string, Property>();
                propertiesSnap.forEach(doc => {
                    const docId = doc.id;
                    if (!uniqueProperties.has(docId)) {
                        uniqueProperties.set(docId, {
                            ...(doc.data() as Omit<Property, 'id'>),
                            id: docId,
                            agentId: doc.ref.parent.parent?.id,
                        } as Property);
                    }
                });
                const allProps = Array.from(uniqueProperties.values());
                setAllProperties(allProps);
                
                const activeProperties = allProps.filter(p => p.status !== 'vendido' && p.status !== 'alugado').length;

                setMetrics({
                    totalAgents,
                    monthlyRevenue,
                    totalActiveProperties: activeProperties,
                });

            } catch (error) {
                console.error("Failed to fetch admin metrics:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchMetrics();
    }, [firestore]);

    return (
        <div className="space-y-8">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold font-headline">
                   Dashboard do Administrador
                </h1>
                <p className="text-muted-foreground">Visão geral da plataforma.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <MotionCard onClick={() => setViewMode('agents')}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Corretores</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <Skeleton className="h-10 w-16 mb-2" />
                            ) : (
                                <div className="text-4xl font-bold">{metrics.totalAgents}</div>
                            )}
                        </CardContent>
                    </Card>
                </MotionCard>

                 <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Mensal (Assinaturas)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <Skeleton className="h-10 w-40 mb-2" />
                             ) : (
                                <>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div className="text-4xl font-bold">
                                                    {formatCurrency(metrics.monthlyRevenue)}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{metrics.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </>
                             )}
                        </CardContent>
                    </Card>
                </MotionCard>

                <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Imóveis Ativos (Total)</CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <Skeleton className="h-10 w-16 mb-2" />
                            ) : (
                                <div className="text-4xl font-bold">{metrics.totalActiveProperties}</div>
                            )}
                        </CardContent>
                    </Card>
                </MotionCard>
            </div>
            
            {viewMode === 'agents' && (
                <div className="flex justify-end">
                    <Button onClick={() => setViewMode('chart')}>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        Exibir Desempenho do Mês
                    </Button>
                </div>
            )}
            
            {viewMode === 'chart' ? (
                 <MonthlyPerformanceChart properties={allProperties || []} isLoading={isLoading} />
            ) : (
                <AgentList agents={agents} isLoading={isLoading} />
            )}
        </div>
    );
}
