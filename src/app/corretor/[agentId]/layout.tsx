
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseServer } from '@/firebase/server-init';
import type { Agent } from '@/lib/data';

export default async function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    const { firestore } = getFirebaseServer();
    const agentRef = doc(firestore, 'agents', params.agentId);
    const agentSnap = await getDoc(agentRef);
    const agent = agentSnap.exists() ? (agentSnap.data() as Agent) : null;
    const theme = agent?.siteSettings?.theme || 'dark';

    return (
        <html lang="pt-BR" className={theme}>
            <body>{children}</body>
        </html>
    );
}
