'use client';
import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase }from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';

function ThemeSetter({ agentId }: { agentId: string }) {
    const firestore = useFirestore();
    const agentRef = useMemoFirebase(
        () => (firestore && agentId ? doc(firestore, 'agents', agentId) : null),
        [firestore, agentId]
    );
    const { data: agentData } = useDoc<Agent>(agentRef);

    useEffect(() => {
        if (agentData?.siteSettings?.theme) {
            const theme = agentData.siteSettings.theme;
            // Remove both classes and add the correct one
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
        }
    }, [agentData]);

    return null; // This component does not render anything
}

export default function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    const { agentId } = params;

    return (
        <>
            <ThemeSetter agentId={agentId} />
            {children}
        </>
    );
}
