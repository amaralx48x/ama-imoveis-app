
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseServer } from '@/firebase/server-init';
import { ThemeProvider, defaultTheme, type Theme } from '@/context/ThemeContext';

export default async function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    const { firestore } = getFirebaseServer();
    let theme: Theme | null = null;
    
    try {
        const themeRef = doc(firestore, 'agents', params.agentId, 'theme', 'current');
        const themeSnap = await getDoc(themeRef);
        
        if (themeSnap.exists()) {
            theme = themeSnap.data() as Theme;
        } else {
            theme = defaultTheme;
        }
    } catch (error) {
        console.error("Failed to fetch theme on server:", error);
        theme = defaultTheme; // Fallback to default theme on error
    }

    return (
        <ThemeProvider theme={theme}>
            {children}
        </ThemeProvider>
    );
}
