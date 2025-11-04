
'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Agent } from '@/lib/data';
import { doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

function ThemeSetter({ agent }: { agent: Agent | null }) {
  useEffect(() => {
    const theme = agent?.siteSettings?.theme || 'dark';
    document.documentElement.className = theme;
  }, [agent]);

  return null;
}

export default function PublicAgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const agentId = params.agentId as string;
    const firestore = useFirestore();

    const agentRef = useMemoFirebase(
      () => (agentId && firestore ? doc(firestore, 'agents', agentId) : null),
      [agentId, firestore]
    );

    const { data: agentData } = useDoc<Agent>(agentRef);

    return (
        <>
            <ThemeSetter agent={agentData} />
            {children}
        </>
    );
}
