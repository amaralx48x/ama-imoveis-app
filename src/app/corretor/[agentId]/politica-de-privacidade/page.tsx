
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseServer } from '@/firebase/server-init';
import type { Agent } from '@/lib/data';
import { defaultPrivacyPolicy } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getPrivacyPolicy(agentId: string) {
    const { firestore } = getFirebaseServer();
    const agentRef = doc(firestore, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
        return null;
    }

    const agent = agentSnap.data() as Agent;
    return agent.siteSettings?.privacyPolicy || defaultPrivacyPolicy;
}

function formatText(text: string) {
    return text.split('\n').map((line, i) => {
        if (line.startsWith('## ')) {
            return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
        }
        if (line.startsWith('**')) {
            return <p key={i} className="font-bold mt-4">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.trim() === '') {
            return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground leading-relaxed mb-2">{line}</p>;
    });
}

export default async function PrivacyPolicyPage({ params }: { params: { agentId: string } }) {
    const { agentId } = params;
    const policy = await getPrivacyPolicy(agentId);

    if (!policy) {
        return notFound();
    }

    return (
        <>
            <Header agentId={agentId} />
            <main className="container mx-auto px-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">Política de Privacidade</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        {formatText(policy)}
                    </CardContent>
                </Card>
            </main>
            <Footer agentId={agentId} />
        </>
    );
}
