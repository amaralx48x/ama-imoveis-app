'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Users, DollarSign } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';
import type { Property, Agent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { isSameMonth } from 'date-fns';
import { MonthlyPerformanceChart } from '@/components/dashboard/monthly-chart';


const MotionCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`transition-all duration-500 ease-out hover:scale-105 hover:shadow-primary/20 ${className}`}>
        {children}
    </div>
);

export default function AdminDashboardPage() {
    const [metrics, setMetrics] = useState({
        totalAgents: 0,
        totalActiveProperties: 0,
        commissionsThisMonth: 0,
    });
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (!firestore) return;

        async function fetchMetrics() {
            setIsLoading(true);
            try {
                // Use collectionGroup to query across all subcollections
                const agentsQuery = collectionGroup(firestore, 'agents');
                const propertiesQuery = collectionGroup(firestore, 'properties');

                const [agentsSnap, propertiesSnap] = await Promise.all([
                    getDocs(agentsQuery),
                    getDocs(propertiesQuery)
                ]);

                const allProps = propertiesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Property);
                setAllProperties(allProps);
                
                const activeProperties = allProps.filter(p => p.status !== 'vendido' && p.status !== 'alugado').length;

                const commissions = allProps
                    .filter(p => {
                         if (!['vendido', 'alugado'].includes(p.status || '') || !p.soldAt) return false;
                        const soldDate = p.soldAt.toDate();
                        return isSameMonth(soldDate, new Date());
                    })
                    .reduce((sum, p) => sum + (p.commissionValue || 0), 0);

                setMetrics({
                    totalAgents: agentsSnap.size,
                    totalActiveProperties: activeProperties,
                    commissionsThisMonth: commissions,
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
                 <MotionCard>
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
                
                <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Comissões no Mês (Total)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? (
                                <Skeleton className="h-10 w-40 mb-2" />
                             ) : (
                                <>
                                    <div className="text-4xl font-bold">
                                        {metrics.commissionsThisMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </div>
                                </>
                             )}
                        </CardContent>
                    </Card>
                </MotionCard>
            </div>
            
            <MonthlyPerformanceChart properties={allProperties || []} isLoading={isLoading} />
        </div>
    );
}
