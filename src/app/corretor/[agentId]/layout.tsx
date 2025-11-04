'use server'; // Marcando como um componente que pode rodar no servidor
import { doc, getDoc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';
import { getFirebaseServer } from '@/firebase/server-init';

// Este é agora um Server Component, o que é mais robusto para buscar dados
export default async function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    const { agentId } = params;
    const { firestore } = getFirebaseServer();
    let agent: Agent | null = null;
    let theme = 'dark'; // Padrão é 'dark'

    // Como estamos no servidor, podemos fazer a busca de dados diretamente aqui
    try {
        if (agentId) {
            const agentRef = doc(firestore, 'agents', agentId);
            const agentSnap = await getDoc(agentRef);
            if (agentSnap.exists()) {
                agent = agentSnap.data() as Agent;
                // Lemos a configuração de tema aqui, no servidor
                theme = agent?.siteSettings?.theme || 'dark';
            }
        }
    } catch (error) {
        console.error("Failed to fetch agent theme on server:", error);
        // Em caso de erro, continuamos com o tema padrão 'dark'
    }

    // A classe do tema é aplicada em uma div que envolve o conteúdo.
    // Isso é seguro e não causa erros de hidratação, pois é definido no servidor.
    return (
        <div className={theme}>
            {children}
        </div>
    );
}
