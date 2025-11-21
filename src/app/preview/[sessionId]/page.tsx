'use client';
import AgentPageClient from '@/app/corretor/[agentId]/agent-page-client';
import { useParams } from 'next/navigation';

export default function PreviewPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    // Renderiza o client component em modo de demonstração
    return <AgentPageClient isDemo={true} demoSessionId={sessionId} />;
}
