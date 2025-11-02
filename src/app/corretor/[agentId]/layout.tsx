
'use client'

import { ThemeProvider } from "@/context/ThemeContext";

// This is a client component because it uses ThemeProvider which is a client context.
export default function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    // We pass the agentId to the ThemeProvider so it can fetch the correct theme.
    return (
        <ThemeProvider agentIdForPublicPage={params.agentId}>
            {children}
        </ThemeProvider>
    );
}
