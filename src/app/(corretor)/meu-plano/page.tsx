
'use client';

import { usePlan, PlanType } from '@/context/PlanContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Gem, X, Loader2 } from 'lucide-react';
import { InfoCard } from '@/components/info-card';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { Agent } from '@/lib/data';
import { doc } from 'firebase/firestore';

const PlanFeature = ({ children, included }: { children: React.ReactNode, included: boolean }) => (
    <li className={`flex items-start gap-3 ${!included ? 'text-muted-foreground' : ''}`}>
        {included ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
        <span>{children}</span>
    </li>
);

export default function MeuPlanoPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { plan, setPlan, limits, currentPropertiesCount, isLoading } = usePlan();

   const agentRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
    [user, firestore]
  );
  const { data: agentData } = useDoc<Agent>(agentRef);
  const isAdmin = agentData?.role === 'admin';


  const handlePlanChange = (newPlan: PlanType) => {
    if (isAdmin) {
      setPlan(newPlan);
    }
  };

  const planSettings = {
    corretor: { 
        maxProperties: 50,
        priceId: "price_1SXSRf2K7btqnPDwReiW165r" 
    },
    imobiliaria: { 
        maxProperties: 300,
        priceId: "price_1SXST22K7btqnPDwfWFoUhH9"
    }
  }

  const planDetails = {
    corretor: {
      name: 'AMAPLUS',
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
      name: 'AMA ULTRA',
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
                    {planDetails.corretor.isCurrent ? (
                        <Button disabled className="w-full" variant="outline">Plano Atual</Button>
                    ) : isAdmin ? (
                         <Button onClick={planDetails.corretor.action} className="w-full" variant="outline">
                            Mudar para AMAPLUS (Admin)
                        </Button>
                    ) : (
                        <Button variant="outline" className="w-full">
                           Fazer Downgrade
                        </Button>
                    )}
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
                     {planDetails.imobiliaria.isCurrent ? (
                        <Button disabled className="w-full" variant="outline">Plano Atual</Button>
                    ) : isAdmin ? (
                        <Button onClick={planDetails.imobiliaria.action} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                             Mudar para AMA ULTRA (Admin)
                        </Button>
                    ) : (
                        <Button className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">
                            Fazer Upgrade
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
