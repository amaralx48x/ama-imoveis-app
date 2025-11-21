'use client';
import React from 'react';
import { useUser } from '@/firebase';
import LeadsPage from '@/components/leads-page';
import { InfoCard } from '@/components/info-card';
import { useDemo } from '@/context/DemoContext';

export default function InboxPage() {
    const { user } = useUser();
    const { isDemo, demoState } = useDemo();

    const agentId = isDemo ? demoState?.agent.id : user?.uid;
    const leads = isDemo ? demoState?.leads : undefined;

    if (!agentId) {
        return (
             <div className="flex items-center justify-center h-64">
                <p>Carregando...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <InfoCard cardId="inbox-info" title="Sua Caixa de Entrada de Leads">
                <p>
                    Todos os contatos feitos através dos formulários do seu site público chegam aqui. Leads "não lidos" são novas oportunidades que aguardam sua atenção.
                </p>
                <p>
                    Você pode filtrar por tipo de lead (Comprador ou Proprietário), arquivar mensagens e exportar sua lista de contatos para usar em outras ferramentas.
                </p>
            </InfoCard>
            <LeadsPage agentId={agentId} initialLeads={leads} />
        </div>
    );
}
