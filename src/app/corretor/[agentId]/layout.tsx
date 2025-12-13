
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

function hexToHsl(hex: string): { h: number, s: number, l: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}


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
            const hsl = hexToHsl(themeColors.solid);
            if (hsl) {
                // Para a cor sólida, usamos a mesma cor para primário e accent para consistência
                root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
                root.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
            }
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
