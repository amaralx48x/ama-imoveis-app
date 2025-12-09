
'use client';
import { AgentMetadata } from '@/components/agent-metadata';
import { Header } from '@/components/layout/header';
import { Footer } from "@/components/layout/footer";
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
            <Header agentId={agentId} />
            {children}
            <Footer agentId={agentId} />
        </>
    );
}
