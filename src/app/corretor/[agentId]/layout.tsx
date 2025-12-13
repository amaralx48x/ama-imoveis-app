
'use client';
import { AgentMetadata } from '@/components/agent-metadata';
import { Header } from '@/components/layout/header';
import { Footer } from "@/components/layout/footer";
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { useEffect } from 'react';

function DynamicStyles() {
    const params = useParams();
    const agentId = params.agentId as string;
    const firestore = useFirestore();

    const agentRef = useMemoFirebase(
        () => (firestore && agentId ? doc(firestore, 'agents', agentId) : null),
        [firestore, agentId]
    );

    const { data: agentData } = useDoc<Agent>(agentRef);

    useEffect(() => {
        const primaryColor = agentData?.siteSettings?.themeColors?.primary;
        const accentColor = agentData?.siteSettings?.themeColors?.accent;
        const root = document.documentElement;

        if (primaryColor) {
            root.style.setProperty('--primary', primaryColor);
        } else {
            root.style.removeProperty('--primary');
        }
        if (accentColor) {
            root.style.setProperty('--accent', accentColor);
        } else {
            root.style.removeProperty('--accent');
        }

    }, [agentData]);

    return null;
}


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
            <DynamicStyles />
            <Header agentId={agentId} />
            {children}
            <Footer agentId={agentId} />
        </>
    );
}
