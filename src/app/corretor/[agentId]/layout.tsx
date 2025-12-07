
'use client';
import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase }from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { useParams } from 'next/navigation';

function AgentSiteLayoutUpdater({ agentId }: { agentId: string }) {
    const firestore = useFirestore();
    const agentRef = useMemoFirebase(
        () => (firestore && agentId ? doc(firestore, 'agents', agentId) : null),
        [firestore, agentId]
    );
    const { data: agentData } = useDoc<Agent>(agentRef);

    useEffect(() => {
        if (!agentData) return;
    
        // Theme logic
        const theme = agentData.siteSettings?.theme || 'dark';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    
        // Favicon logic
        const faviconUrl = agentData.siteSettings?.faviconUrl;
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconUrl || '/favicon.ico'; // Fallback to a default favicon
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
            <AgentSiteLayoutUpdater agentId={agentId} />
            {children}
        </>
    );
}
