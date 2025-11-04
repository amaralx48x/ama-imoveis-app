'use client';
import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase }from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { useParams } from 'next/navigation';

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
        } else {
            // Fallback to dark theme if not set
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
        }
    }, [agentData]);

    return null; // This component does not render anything
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
            <ThemeSetter agentId={agentId} />
            {children}
        </>
    );
}
