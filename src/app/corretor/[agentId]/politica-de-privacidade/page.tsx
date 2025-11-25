
'use client';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { defaultPrivacyPolicy } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Skeleton } from '@/components/ui/skeleton';

function PolicySkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-2/3 mb-8" />
        <div className="space-y-4">
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <br/>
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
        </div>
    </div>
  )
}

function PolicyContent({ content, title }: { content: string, title: string}) {
    const formatText = (text: string) => {
        return text
            .split('\n')
            .map((line, i) => {
                const key = `${title}-${i}`;
                if (line.startsWith('## ')) return <h2 key={key} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
                if (line.startsWith('**')) return <p key={key} className="font-bold mt-4">{line.replace(/\*\*/g, '')}</p>;
                if (line.trim() === '') return <br key={key} />;
                return <p key={key} className="text-muted-foreground leading-relaxed mb-2">{line}</p>;
            });
    };

    return <div className="prose dark:prose-invert max-w-none">{formatText(content)}</div>;
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
                    <PolicySkeleton />
                </main>
                <Footer agentId={agentId} />
            </>
        )
    }

    if (!agent) {
        return notFound();
    }
    
    const policyContent = agent?.siteSettings?.privacyPolicy || defaultPrivacyPolicy;

    return (
        <>
            <Header agent={agent} agentId={agentId} />
            <main className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-extrabold font-headline mb-8">Política de Privacidade</h1>
                <PolicyContent content={policyContent} title="privacy"/>
            </main>
            <Footer agentId={agentId} />
        </>
    );
}

