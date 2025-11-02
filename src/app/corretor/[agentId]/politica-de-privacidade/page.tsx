
'use client';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useFirestore } from '@/firebase';
import { defaultPrivacyPolicy } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PoliticaDePrivacidadePage() {
    const params = useParams();
    const agentId = params.agentId as string;
    const firestore = useFirestore();
    
    const [agent, setAgent] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !agentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const agentRef = doc(firestore, 'agents', agentId);
                const agentSnap = await getDoc(agentRef);

                if (!agentSnap.exists()) {
                    notFound();
                    return;
                }
                
                const agentData = { id: agentSnap.id, ...agentSnap.data() } as Agent;
                setAgent(agentData);

            } catch (error) {
                console.error("Error fetching agent data on client:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [firestore, agentId]);

    if (isLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            </div>
        );
    }
    
    if (!agent) {
        notFound();
    }

    const privacyPolicy = agent.siteSettings?.privacyPolicy || defaultPrivacyPolicy;
    // Basic markdown-to-HTML conversion
    const formatText = (text: string) => {
        return text
            .split('\n')
            .map(line => {
                if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-6 mb-3">${line.substring(3)}</h2>`;
                if (line.startsWith('**')) return `<p class="font-bold mt-4">${line.replace(/\*\*/g, '')}</p>`;
                if (line.trim() === '') return '<br />';
                return `<p class="text-muted-foreground leading-relaxed mb-2">${line}</p>`;
            })
            .join('');
    };

    return (
        <>
            <Header agent={agent} agentId={agent.id}/>
            <main className="min-h-screen container mx-auto px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-4xl font-headline">Política de Privacidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formatText(privacyPolicy) }} />
                    </CardContent>
                </Card>
            </main>
            <Footer agentId={agent.id} />
        </>
    );
}
