'use client';
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useParams, notFound } from "next/navigation";
import type { Agent } from "@/lib/data";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function PolicyPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
             <div className="space-y-3 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
    )
}

function PolicyContent({ content }: { content: string }) {
    const formattedContent = content
        .split('\n')
        .map((line, i) => {
            if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
            if (line.startsWith('**')) return <p key={i} className="font-bold mt-4">{line.replace(/\*\*/g, '')}</p>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="text-muted-foreground leading-relaxed mb-2">{line}</p>;
        });

    return <div className="prose dark:prose-invert max-w-none">{formattedContent}</div>;
}


export default function PrivacyPolicyPage() {
    const params = useParams();
    const agentId = params.agentId as string;
    const firestore = useFirestore();

    const agentRef = useMemoFirebase(
        () => (firestore && agentId ? doc(firestore, 'agents', agentId) : null),
        [firestore, agentId]
    );

    const { data: agent, isLoading } = useDoc<Agent>(agentRef);

    if (isLoading) {
        return (
            <>
                <Header agentId={agentId} />
                <main className="min-h-screen">
                    <PolicyPageSkeleton />
                </main>
                <Footer agentId={agentId} />
            </>
        )
    }

    if (!agent) {
        return notFound();
    }
    
    const policyContent = agent.siteSettings?.privacyPolicy;
    if (!policyContent) {
        return (
            <div className="text-center py-10">
                <p>O conteúdo da política de privacidade não foi definido.</p>
            </div>
        )
    }
    
    return (
        <>
            <Header agent={agent} agentId={agentId} />
            <main className="container mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-4xl font-headline">Política de Privacidade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PolicyContent content={policyContent} />
                    </CardContent>
                </Card>
            </main>
            <Footer agentId={agentId} />
        </>
    )
}