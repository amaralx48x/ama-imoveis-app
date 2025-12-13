
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
            // No modo sólido, usamos regex para extrair os valores HSL da cor hexadecimal.
            // Isso não é perfeito mas funciona para a maioria dos casos.
            // Idealmente, precisaríamos de uma lib de conversão de cores.
            const hex = themeColors.solid.replace('#', '');
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            
            // Apenas para simplificar, vamos usar a mesma cor para primário e accent.
            // Para um efeito mais sofisticado, poderíamos calcular variações.
            root.style.setProperty('--primary', `${r} ${g} ${b}`);
            root.style.setProperty('--accent', `${r} ${g} ${b}`);

        } else {
            const selectedGradientName = themeColors?.gradientName || 'Padrão (Roxo/Rosa)';
            const selectedGradient = gradients.find(g => g.name === selectedGradientName) || gradients[0];
            
            // Extrai apenas os números HSL da string 'hsl(H S% L%)'
            const primaryColor = selectedGradient.from.match(/\(([^)]+)\)/)?.[1] || '262 86% 56%';
            const accentColor = selectedGradient.to.match(/\(([^)]+)\)/)?.[1] || '330 86% 56%';

            root.style.setProperty('--primary', primaryColor);
            root.style.setProperty('--accent', accentColor);
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
