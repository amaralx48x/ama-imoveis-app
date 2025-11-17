
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
        // On initial load, respect saved user preference first, then agent's setting
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(savedTheme);
        } else if (agentData?.siteSettings?.theme) {
            const theme = agentData.siteSettings.theme;
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
            localStorage.setItem('theme', theme); // Save agent's default if no user pref
        } else {
            // Fallback to dark theme if nothing is set
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
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
