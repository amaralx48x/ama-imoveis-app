
'use client';
import { AgentMetadata } from '@/components/agent-metadata';
import { useParams } from 'next/navigation';

export default function PublicAgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const agentId = params.agentId as string;

    return (
        <>
            <AgentMetadata agentId={agentId} />
            {children}
        </>
    );
}
