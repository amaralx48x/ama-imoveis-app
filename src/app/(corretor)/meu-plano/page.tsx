
'use client';

import { usePlan, PlanType } from '@/context/PlanContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gem, X, Loader2, Star, ChevronDown, Settings } from 'lucide-react';
import { InfoCard } from '@/components/info-card';
import { useUser, useDoc, useFirestore } from '@/firebase';
import type { Agent } from '@/lib/data';
import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import SubscribeButton from '@/components/SubscribeButton';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

function PlanActionButton({ planName, priceId, isCurrent, children, recommended }: { planName: string, priceId: string, isCurrent: boolean, children: React.ReactNode, recommended?: boolean }) {
    const { user } = useUser();
    
    if (isCurrent) {
      return <Button disabled className="w-full" variant="outline">Plano Atual</Button>;
    }

    return (
        <SubscribeButton
            priceId={priceId}
            email={user?.email}
            userId={user?.uid}
            className={cn("w-full", recommended && "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black shadow-lg hover:opacity-90")}
        >
            {children}
        </SubscribeButton>
    )
}

function PlanCard({ planDetail }: { planDetail: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const featuresToShow = 5;

    return (
        <Card className={cn('flex flex-col relative', planDetail.isCurrent && 'border-primary ring-2 ring-primary', planDetail.recommended && 'border-blue-500')}>
            {planDetail.recommended && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-fit px-4 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> RECOMENDADO
            </div>
            )}
            <CardHeader className={cn(planDetail.recommended && 'bg-blue-500 text-white rounded-t-lg')}>
                <CardTitle className="text-2xl font-bold">{planDetail.name}</CardTitle>
                <CardDescription className={cn(planDetail.recommended && 'text-blue-100')}>
                    {planDetail.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 pt-6">
                <p className="text-4xl font-bold">
                    <span className={cn(planDetail.recommended && 'text-blue-500')}>R$ {planDetail.price}</span>
                    <span className="text-lg font-normal text-muted-foreground">/mês</span>
                </p>
                 <ul className="space-y-3 text-sm">
                    {planDetail.features.slice(0, featuresToShow).map((feat: any, index: number) => (
                        <PlanFeature key={index} included={feat.included}>{feat.text}</PlanFeature>
                    ))}
                </ul>

                {planDetail.features.length > featuresToShow && (
                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                        <CollapsibleContent className="space-y-3 text-sm animate-accordion-down">
                             {planDetail.features.slice(featuresToShow).map((feat: any, index: number) => (
                                <PlanFeature key={index} included={feat.included}>{feat.text}</PlanFeature>
                            ))}
                        </CollapsibleContent>
                        <CollapsibleTrigger asChild>
                            <Button variant="link" className="p-0 h-auto text-xs mt-2 text-primary">
                                {isOpen ? 'Ver menos benefícios' : 'Ver mais benefícios'}
                                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </CollapsibleTrigger>
                    </Collapsible>
                )}
            </CardContent>
            <CardFooter>
                <PlanActionButton
                    planName={planDetail.name}
                    priceId={planDetail.priceId}
                    isCurrent={planDetail.isCurrent}
                    recommended={planDetail.recommended}
                >
                    {planDetail.isCurrent ? "Plano Atual" : 'Contratar Plano'}
                </PlanActionButton>
            </CardFooter>
        </Card>
    )
}

const PlanFeature = ({ children, included }: { children: React.ReactNode, included: boolean }) => (
    <li className={`flex items-start gap-3 ${!included ? 'text-muted-foreground' : ''}`}>
        {included ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
        <span>{children}</span>
    </li>
);

function SubscriptionStatus({ agentData }: { agentData: Agent | null }) {
    const [isRedirecting, setIsRedirecting] = useState(false);
    const { toast } = useToast();

    const handleManageSubscription = async () => {
        if (!agentData?.stripeCustomerId) return;
        setIsRedirecting(true);
        try {
            const res = await fetch('/api/create-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: agentData.stripeCustomerId }),
            });
            if (!res.ok) throw new Error('Falha ao criar sessão do portal.');
            const { url } = await res.json();
            window.location.href = url;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
            setIsRedirecting(false);
        }
    };
    
    if (!agentData?.stripeSubscriptionId) {
        return null;
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">Sua Assinatura</CardTitle>
                <CardDescription>Gerencie os detalhes do seu plano e pagamento.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/50">
                    <div>
                        <p className="text-sm text-muted-foreground">Status da Assinatura</p>
                        <p className="font-bold text-lg capitalize">{agentData.stripeSubscriptionStatus || 'Desconhecido'}</p>
                    </div>
                     <Button onClick={handleManageSubscription} disabled={isRedirecting}>
                        {isRedirecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Settings className="mr-2 h-4 w-4" />}
                        Gerenciar Assinatura
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function MeuPlanoPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { plan, limits, currentPropertiesCount, isLoading, planSettings } = usePlan();

   const agentRef = useMemo(() => (user && firestore ? doc(firestore, 'agents', user.uid) : null), [user, firestore]);
  const { data: agentData } = useDoc<Agent>(agentRef);

  const planDetails = {
    simples: {
      name: planSettings.simples.name,
      description: 'Serviço inicial para o seu orçamento',
      price: '39,99',
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até ${planSettings.simples.maxProperties} imóveis`, included: true },
        { text: '32 Fotos por imóvel', included: true },
        { text: `${planSettings.simples.maxCatalogPages} Catálogos de Imóveis (sites extras)`, included: true },
        { text: 'Usuário único do Sistema', included: true },
        { text: 'Esteira de Leads', included: false },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV', included: planSettings.simples.canImportCSV },
      ],
      isCurrent: plan === 'simples',
      priceId: planSettings.simples.priceId,
    },
     essencial: {
      name: planSettings.essencial.name,
      description: 'Para quem está em constante evolução',
      price: '59,99',
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até ${planSettings.essencial.maxProperties} imóveis`, included: true },
        { text: '50 Fotos por Imóvel', included: true },
        { text: `${planSettings.essencial.maxCatalogPages} Catálogos de Imóveis (sites extras)`, included: true },
        { text: '3 Usuários do Sistema', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV', included: planSettings.essencial.canImportCSV },
      ],
      isCurrent: plan === 'essencial',
      priceId: planSettings.essencial.priceId,
    },
     impulso: {
      name: planSettings.impulso.name,
      description: 'Eleve sua jornada para o próximo patamar',
      price: '89,99',
      recommended: true,
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até ${planSettings.impulso.maxProperties} imóveis`, included: true },
        { text: '64 Fotos por Imóvel', included: true },
        { text: `${planSettings.impulso.maxCatalogPages} Catálogos de Imóveis (sites extras)`, included: true },
        { text: '5 Usuários do Sistema', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV e XML', included: planSettings.impulso.canImportCSV },
      ],
      isCurrent: plan === 'impulso',
      priceId: planSettings.impulso.priceId,
    },
    expansao: {
      name: planSettings.expansao.name,
      description: 'Para negócios que exigem a mais alta perfomance',
      price: '149,99',
      features: [
        { text: 'Site Próprio Personalizável', included: true },
        { text: `Cadastro de até ${planSettings.expansao.maxProperties} imóveis`, included: true },
        { text: '64 Fotos por Imóvel', included: true },
        { text: `${planSettings.expansao.maxCatalogPages} Catálogos de Imóveis (sites extras)`, included: true },
        { text: '15 Usuários do Sistema', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
        { text: 'Exportação CSV e XML', included: planSettings.expansao.canImportCSV },
      ],
      isCurrent: plan === 'expansao',
      priceId: planSettings.expansao.priceId,
    },
  };
  
  const currentPlanName = plan ? planSettings[plan].name : '...';

  return (
    <div className="space-y-8">
        <InfoCard cardId="meu-plano-info" title="Seu Plano e Limites">
            <p>
                Aqui você pode visualizar os recursos do seu plano atual e seus limites de uso. Para fazer upgrade ou downgrade do seu plano, basta escolher o plano desejado e prosseguir para o pagamento.
            </p>
        </InfoCard>

        <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Gem /> Meu Plano e Assinatura</h1>
            <p className="text-muted-foreground">Gerencie sua assinatura, veja seus limites e faça upgrade.</p>
        </div>

        <SubscriptionStatus agentData={agentData} />

        <Card>
            <CardHeader>
                <CardTitle>Resumo do Uso</CardTitle>
                <CardDescription>Acompanhe o uso dos recursos do seu plano atual.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando informações do plano...</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p>Plano Atual: <span className="font-bold text-primary">{currentPlanName}</span></p>
                        <p>Imóveis Cadastrados: <span className="font-bold">{currentPropertiesCount} / {limits.maxProperties}</span></p>
                    </div>
                )}
            </CardContent>
        </Card>

        <Separator />
        
        <div className="text-center">
             <h2 className="text-2xl font-bold font-headline">Escolha o Plano Ideal para Você</h2>
             <p className="text-muted-foreground">Todos os planos incluem um período de teste de 7 dias.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(planDetails).map((p) => (
            <PlanCard key={p.name} planDetail={p} />
          ))}
        </div>
    </div>
  );
}
