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
        // Theme logic
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(savedTheme);
        } else if (agentData?.siteSettings?.theme) {
            const theme = agentData.siteSettings.theme;
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
            localStorage.setItem('theme', theme);
        } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        
        // Favicon logic
        if (agentData?.siteSettings?.faviconUrl) {
            let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = agentData.siteSettings.faviconUrl;
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
            <AgentSiteLayoutUpdater agentId={agentId} />
            {children}
        </>
    );
}
