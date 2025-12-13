
'use client';
import { AgentMetadata } from '@/components/agent-metadata';
import { Header } from '@/components/layout/header';
import { Footer } from "@/components/layout/footer";
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { useEffect } from 'react';

const gradients = [
    { name: 'Padrão (Roxo/Rosa)', from: 'hsl(262 86% 56%)', to: 'hsl(330 86% 56%)' },
    { name: 'Oceano (Azul/Verde)', from: 'hsl(210 90% 50%)', to: 'hsl(160 80% 40%)' },
    { name: 'Pôr do Sol (Laranja/Amarelo)', from: 'hsl(30 90% 55%)', to: 'hsl(50 100% 50%)' },
    { name: 'Esmeralda (Verde/Ciano)', from: 'hsl(145 70% 45%)', to: 'hsl(175 80% 40%)' },
    { name: 'Vibrante (Rosa/Laranja)', from: 'hsl(340 90% 60%)', to: 'hsl(20 95% 55%)' },
];

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
        const root = document.documentElement;
        const themeColors = agentData?.siteSettings?.themeColors;

        if (themeColors?.mode === 'solid' && themeColors.solid) {
            root.style.setProperty('--primary', themeColors.solid);
            root.style.setProperty('--accent', themeColors.solid);
        } else {
            const selectedGradientName = themeColors?.gradientName || 'Padrão (Roxo/Rosa)';
            const selectedGradient = gradients.find(g => g.name === selectedGradientName) || gradients[0];
            root.style.setProperty('--primary', selectedGradient.from);
            root.style.setProperty('--accent', selectedGradient.to);
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
