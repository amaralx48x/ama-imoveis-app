
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseServer } from '@/firebase/server-init';

export default async function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    // This layout can be used to fetch data that is common to all public agent pages.
    // For now, it just renders the children.
    return <>{children}</>;
}
