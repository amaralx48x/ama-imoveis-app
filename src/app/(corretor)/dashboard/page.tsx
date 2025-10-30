'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Home, FileText, Plus, Minus, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MotionCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`transition-all duration-500 ease-out hover:scale-105 hover:shadow-primary/20 ${className}`}>
        {children}
    </div>
);

export default function DashboardPage() {
    const [newContracts, setNewContracts] = useState(5);
    const [isEditingCommission, setIsEditingCommission] = useState(false);
    const [commissionValue, setCommissionValue] = useState(12500.00);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia";
        if (hour < 18) return "Boa tarde";
        return "Boa noite";
    }

    return (
        <div className="space-y-8">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold font-headline">
                    {greeting()}, <span className="text-gradient">Ana Maria</span>!
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
                            <div className="text-4xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">+2 na última semana</p>
                        </CardContent>
                    </Card>
                </MotionCard>
                
                <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Comissões no Mês</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {isEditingCommission ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        value={commissionValue}
                                        onChange={(e) => setCommissionValue(parseFloat(e.target.value))}
                                        className="text-2xl font-bold h-12"
                                    />
                                </div>
                            ) : (
                                <div className="text-4xl font-bold">
                                    {commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Cálculo baseado em imóveis negociados</p>
                        </CardContent>
                         <CardFooter className="pt-0">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingCommission(!isEditingCommission)}>
                                <Pencil className="h-3 w-3 mr-2" />
                                {isEditingCommission ? 'Salvar Valor' : 'Corrigir Manualmente'}
                            </Button>
                        </CardFooter>
                    </Card>
                </MotionCard>
                
                <MotionCard>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Novos Contratos (Mês)</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{newContracts}</div>
                            <p className="text-xs text-muted-foreground">Contador manual de novos negócios</p>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-0">
                            <Button variant="outline" size="icon" onClick={() => setNewContracts(c => Math.max(0, c - 1))}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setNewContracts(c => c + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                </MotionCard>
            </div>
             {/* O restante dos componentes (Inbox, etc.) virá aqui */}
        </div>
    );
}
