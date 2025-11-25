
'use client';

import { usePlan, PlanType } from '@/context/PlanContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gem, X, Loader2 } from 'lucide-react';
import { InfoCard } from '@/components/info-card';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { Agent } from '@/lib/data';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import SubscribeButton from '@/components/SubscribeButton';

const PlanFeature = ({ children, included }: { children: React.ReactNode, included: boolean }) => (
    <li className={`flex items-start gap-3 ${!included ? 'text-muted-foreground' : ''}`}>
        {included ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
        <span>{children}</span>
    </li>
);

function PlanActionButton({ planName, priceId, isCurrent, isAdmin, onAdminChange, children }: { planName: string, priceId: string, isCurrent: boolean, isAdmin: boolean, onAdminChange: () => void, children: React.ReactNode }) {
    const { user } = useUser();
    
    if (isCurrent) {
      return <Button disabled className="w-full" variant="outline">Plano Atual</Button>;
    }

    if (isAdmin) {
        return <Button onClick={onAdminChange} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">{children}</Button>;
    }

    return (
        <SubscribeButton
            priceId={priceId}
            email={user?.email}
            userId={user?.uid}
            className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity"
        >
            {children}
        </SubscribeButton>
    )
}

export default function MeuPlanoPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { plan, limits, currentPropertiesCount, isLoading } = usePlan();

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

  const planSettings = {
    corretor: { 
        name: 'AMAPLUS',
        maxProperties: 50,
        priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || "price_1SXSRf2K7btqnPDwReiW165r" 
    },
    imobiliaria: { 
        name: 'AMA ULTRA',
        maxProperties: 300,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "price_1SXST22K7btqnPDwfWFoUhH9"
    }
  }

  const planDetails = {
    corretor: {
      name: planSettings.corretor.name,
      price: '39,90',
      description: 'Para corretores individuais',
      features: [
        { text: 'Site profissional personalizável', included: true },
        { text: 'Painel de controle', included: true },
        { text: 'CRM completo', included: true },
        { text: 'SEO (Otimização para Google)', included: true },
        { text: 'Lista de captação de leads', included: true },
        { text: `Até ${planSettings.corretor.maxProperties} imóveis simultâneos`, included: true },
        { text: '5 GB de dados por mês', included: true },
        { text: 'Domínio pago à parte (R$ 40/anual)', included: true },
        { text: 'Importar lista de imóveis por CSV', included: false },
        { text: 'Atendimento prioritário técnico', included: false },
      ],
      action: () => handlePlanChange('corretor'),
      isCurrent: plan === 'corretor',
      priceId: planSettings.corretor.priceId,
    },
    imobiliaria: {
      name: planSettings.imobiliaria.name,
      price: '59,90',
      description: 'Para equipes e imobiliárias',
      features: [
        { text: 'Site profissional personalizável', included: true },
        { text: 'Painel de controle', included: true },
        { text: 'CRM completo', included: true },
        { text: 'SEO (Otimização para Google)', included: true },
        { text: 'Lista de captação de leads', included: true },
        { text: `Até ${planSettings.imobiliaria.maxProperties} imóveis cadastrados`, included: true },
        { text: '10 GB de dados por mês', included: true },
        { text: 'Importar lista de imóveis por CSV', included: true },
        { text: 'Domínio personalizado de graça', included: true },
        { text: 'Atendimento prioritário técnico', included: true },
      ],
      action: () => handlePlanChange('imobiliaria'),
      isCurrent: plan === 'imobiliaria',
      priceId: planSettings.imobiliaria.priceId,
    },
  };
  

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
                        <p>Plano Atual: <span className="font-bold text-primary">{planDetails[plan].name}</span></p>
                        <p>Imóveis Cadastrados: <span className="font-bold">{currentPropertiesCount} / {limits.maxProperties}</span></p>
                    </div>
                )}
            </CardContent>
        </Card>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className={`flex flex-col ${planDetails.corretor.isCurrent ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader>
                    <CardTitle className="text-2xl">{planDetails.corretor.name}</CardTitle>
                    <CardDescription>{planDetails.corretor.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <p className="text-4xl font-bold">R$ {planDetails.corretor.price}<span className="text-lg font-normal text-muted-foreground">/mês</span></p>
                    <ul className="space-y-2 text-sm">
                        {planDetails.corretor.features.map(feat => (
                            <PlanFeature key={feat.text} included={feat.included}>{feat.text}</PlanFeature>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <PlanActionButton
                        planName={planDetails.corretor.name}
                        priceId={planDetails.corretor.priceId}
                        isCurrent={planDetails.corretor.isCurrent}
                        isAdmin={isAdmin}
                        onAdminChange={planDetails.corretor.action}
                    >
                         {planDetails.corretor.isCurrent ? "Plano Atual" : isAdmin ? "Mudar para AMAPLUS (Admin)" : "Fazer Downgrade"}
                    </PlanActionButton>
                </CardFooter>
            </Card>

             <Card className={`flex flex-col ${planDetails.imobiliaria.isCurrent ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader>
                    <CardTitle className="text-2xl">{planDetails.imobiliaria.name}</CardTitle>
                    <CardDescription>{planDetails.imobiliaria.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                     <p className="text-4xl font-bold">R$ {planDetails.imobiliaria.price}<span className="text-lg font-normal text-muted-foreground">/mês</span></p>
                     <ul className="space-y-2 text-sm">
                        {planDetails.imobiliaria.features.map(feat => (
                             <PlanFeature key={feat.text} included={feat.included}>{feat.text}</PlanFeature>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <PlanActionButton
                        planName={planDetails.imobiliaria.name}
                        priceId={planDetails.imobiliaria.priceId}
                        isCurrent={planDetails.imobiliaria.isCurrent}
                        isAdmin={isAdmin}
                        onAdminChange={planDetails.imobiliaria.action}
                    >
                         {planDetails.imobiliaria.isCurrent ? "Plano Atual" : isAdmin ? "Mudar para AMA ULTRA (Admin)" : "Fazer Upgrade"}
                    </PlanActionButton>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
