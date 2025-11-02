
'use client';

import { usePlan, PlanType } from '@/context/PlanContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Gem } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MeuPlanoPage() {
  const { plan, setPlan, limits, currentPropertiesCount, isLoading } = usePlan();

  const handlePlanChange = (newPlan: PlanType) => {
    setPlan(newPlan);
  };

  const planDetails = {
    corretor: {
      name: 'Corretor Plus',
      price: '59,90',
      features: [
        `Limite de ${limits.maxProperties} imóveis`,
        'Gerenciamento de Leads',
        'Site Pessoal Otimizado',
        'Suporte por E-mail',
      ],
      upgradeAction: () => handlePlanChange('imobiliaria'),
      isCurrent: plan === 'corretor',
    },
    imobiliaria: {
      name: 'Imobiliária Plus',
      price: '89,90',
      features: [
        'Imóveis Ilimitados',
        'Importação de imóveis via CSV',
        'Métricas Avançadas (Em breve)',
        'Suporte Prioritário',
      ],
      downgradeAction: () => handlePlanChange('corretor'),
      isCurrent: plan === 'imobiliaria',
    },
  };

  return (
    <div className="space-y-8">
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
                    <p>Carregando...</p>
                ) : (
                    <div className="space-y-2">
                        <p>Plano Atual: <span className="font-bold text-primary">{planDetails[plan].name}</span></p>
                        <p>Imóveis Cadastrados: <span className="font-bold">{currentPropertiesCount} / {limits.maxProperties === Infinity ? 'Ilimitado' : limits.maxProperties}</span></p>
                    </div>
                )}
            </CardContent>
        </Card>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className={`flex flex-col ${plan === 'corretor' ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader>
                    <CardTitle className="text-2xl">{planDetails.corretor.name}</CardTitle>
                    <CardDescription>Ideal para corretores autônomos e iniciantes.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <p className="text-4xl font-bold">R$ {planDetails.corretor.price}<span className="text-lg font-normal text-muted-foreground">/mês</span></p>
                    <ul className="space-y-2">
                        {planDetails.corretor.features.map(feat => (
                            <li key={feat} className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-muted-foreground">{feat}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    {plan === 'corretor' ? (
                        <Button disabled className="w-full" variant="outline">Plano Atual</Button>
                    ) : (
                        <Button onClick={planDetails.imobiliaria.downgradeAction} className="w-full" variant="outline">Fazer Downgrade</Button>
                    )}
                </CardFooter>
            </Card>

             <Card className={`flex flex-col ${plan === 'imobiliaria' ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader>
                    <CardTitle className="text-2xl">{planDetails.imobiliaria.name}</CardTitle>
                    <CardDescription>Perfeito para imobiliárias e corretores experientes.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                     <p className="text-4xl font-bold">R$ {planDetails.imobiliaria.price}<span className="text-lg font-normal text-muted-foreground">/mês</span></p>
                     <ul className="space-y-2">
                        {planDetails.imobiliaria.features.map(feat => (
                            <li key={feat} className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-muted-foreground">{feat}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                     {plan === 'imobiliaria' ? (
                        <Button disabled className="w-full" variant="outline">Plano Atual</Button>
                    ) : (
                        <Button onClick={planDetails.corretor.upgradeAction} className="w-full bg-gradient-to-r from-[#FF69B4] to-[#8A2BE2] hover:opacity-90 transition-opacity">Fazer Upgrade</Button>
                    )}
                </CardFooter>
            </Card>
        </div>
         <Alert>
            <Gem className="h-4 w-4" />
            <AlertTitle>Ambiente de Demonstração</AlertTitle>
            <AlertDescription>
                A troca de planos nesta página é apenas para simular as funcionalidades. Nenhuma cobrança real será efetuada.
            </AlertDescription>
        </Alert>
    </div>
  );
}
