
'use client';

import { usePlan, PlanType } from '@/context/PlanContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gem, X, Loader2, Star } from 'lucide-react';
import { InfoCard } from '@/components/info-card';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { Agent } from '@/lib/data';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import SubscribeButton from '@/components/SubscribeButton';
import { cn } from '@/lib/utils';


const PlanFeature = ({ children, included }: { children: React.ReactNode, included: boolean }) => (
    <li className={`flex items-start gap-3 ${!included ? 'text-muted-foreground' : ''}`}>
        {included ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
        <span>{children}</span>
    </li>
);

function PlanActionButton({ planName, priceId, isCurrent, isAdmin, onAdminChange, children, recommended }: { planName: string, priceId: string, isCurrent: boolean, isAdmin: boolean, onAdminChange: () => void, children: React.ReactNode, recommended?: boolean }) {
    const { user } = useUser();
    
    if (isCurrent) {
      return <Button disabled className="w-full" variant="outline">Plano Atual</Button>;
    }

    if (isAdmin) {
        return <Button onClick={onAdminChange} className={cn("w-full", recommended && "bg-yellow-500 text-black hover:bg-yellow-600")}>{children}</Button>;
    }

    return (
        <SubscribeButton
            priceId={priceId}
            email={user?.email}
            userId={user?.uid}
            className={cn("w-full", recommended && "bg-yellow-500 text-black hover:bg-yellow-600")}
        >
            {children}
        </SubscribeButton>
    )
}

export default function MeuPlanoPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { plan, limits, currentPropertiesCount, isLoading, planSettings } = usePlan();

   const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  const { data: agentData } = useDoc<Agent>(agentRef);
  const isAdmin = agentData?.role === 'admin';


  const handlePlanChange = async (newPlan: PlanType) => {
    if (isAdmin && agentRef) {
      try {
        await updateDoc(agentRef, { plan: newPlan });
        toast({ title: "Plano alterado com sucesso (Admin)"});
      } catch (error) {
         toast({ title: "Erro ao alterar plano", variant: "destructive"});
      }
    }
  };

  const planDetails = {
    simples: {
      name: 'Simples',
      subtitle: 'Plano 1',
      description: 'Serviço inicial para o seu orçamento',
      price: '54,99',
      features: [
        { text: `Cadastro de até ${planSettings.simples.maxProperties} imóveis`, included: true },
        { text: '32 Fotos por imóvel', included: true },
        { text: '5 Catálogos de Imóveis (sites extras)', included: true },
        { text: 'Usuário único do Sistema', included: true },
        { text: 'Inteligência Artificial', included: false },
        { text: 'Esteira de Leads', included: false },
        { text: 'Certificado SSL', included: false },
      ],
      action: () => handlePlanChange('simples'),
      isCurrent: plan === 'simples',
      priceId: planSettings.simples.priceId,
    },
     essencial: {
      name: 'Essencial',
      subtitle: 'Plano 2',
      description: 'Para quem está em constante evolução',
      price: '74,99',
      features: [
        { text: `Cadastro de até ${planSettings.essencial.maxProperties} imóveis`, included: true },
        { text: '50 Fotos por Imóvel', included: true },
        { text: '10 Catálogos de Imóveis (sites extras)', included: true },
        { text: '3 Usuários do Sistema', included: true },
        { text: 'Inteligência Artificial', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
      ],
      action: () => handlePlanChange('essencial'),
      isCurrent: plan === 'essencial',
      priceId: planSettings.essencial.priceId,
    },
     impulso: {
      name: 'Impulso',
      subtitle: 'Plano 3',
      description: 'Eleve sua jornada para o próximo patamar',
      price: '119,99',
      recommended: true,
      features: [
        { text: `Cadastro de até ${planSettings.impulso.maxProperties} imóveis`, included: true },
        { text: '64 Fotos por Imóvel', included: true },
        { text: '20 Catálogos de Imóveis (sites extras)', included: true },
        { text: '5 Usuários do Sistema', included: true },
        { text: 'Inteligência Artificial', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
      ],
      action: () => handlePlanChange('impulso'),
      isCurrent: plan === 'impulso',
      priceId: planSettings.impulso.priceId,
    },
    expansao: {
      name: 'Expansão',
      subtitle: 'Plano 4',
      description: 'Para negócios que exigem a mais alta perfomance',
      price: '249,99',
      features: [
        { text: `Cadastro de até ${planSettings.expansao.maxProperties} imóveis`, included: true },
        { text: '64 Fotos por Imóvel', included: true },
        { text: '40 Catálogos de Imóveis (sites extras)', included: true },
        { text: '15 Usuários do Sistema', included: true },
        { text: 'Inteligência Artificial', included: true },
        { text: 'Esteira de Leads', included: true },
        { text: 'Certificado SSL', included: true },
      ],
      action: () => handlePlanChange('expansao'),
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
             {isAdmin && (
                <p className="mt-2 text-primary font-semibold">
                    Você é um administrador. Os botões de troca de plano estão ativos para fins de teste.
                </p>
             )}
        </InfoCard>

        <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Gem /> Meu Plano e Assinatura</h1>
            <p className="text-muted-foreground">Gerencie sua assinatura, veja seus limites e faça upgrade.</p>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(planDetails).map((p) => (
            <Card key={p.name} className={cn('flex flex-col relative', p.isCurrent && 'border-primary ring-2 ring-primary', p.recommended && 'border-blue-500')}>
              {p.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-fit px-4 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> RECOMENDADO
                </div>
              )}
              <CardHeader className={cn(p.recommended && 'bg-blue-500 text-white rounded-t-lg')}>
                  <CardTitle className="text-2xl font-bold">{p.name}</CardTitle>
                  <CardDescription className={cn(p.recommended && 'text-blue-100')}>
                    {p.description}
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4 pt-6">
                  <p className="text-4xl font-bold text-blue-500">
                    <span className={cn(p.recommended && 'text-white')}>R$ {p.price}</span>
                    <span className="text-lg font-normal text-muted-foreground">/mês</span>
                  </p>
                  <ul className="space-y-3 text-sm">
                      {p.features.map(feat => (
                          <PlanFeature key={feat.text} included={feat.included}>{feat.text}</PlanFeature>
                      ))}
                  </ul>
              </CardContent>
              <CardFooter>
                  <PlanActionButton
                      planName={p.name}
                      priceId={p.priceId}
                      isCurrent={p.isCurrent}
                      isAdmin={isAdmin}
                      onAdminChange={p.action}
                      recommended={p.recommended}
                  >
                        {p.isCurrent ? "Plano Atual" : 'TESTE GRÁTIS'}
                  </PlanActionButton>
              </CardFooter>
            </Card>
          ))}
        </div>
    </div>
  );
}


