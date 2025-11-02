'use client'

import { ThemeProvider } from "@/context/ThemeContext";

export default function PublicAgentLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { agentId: string };
}) {
    return (
        <ThemeProvider agentIdForPublicPage={params.agentId}>
            {children}
        </ThemeProvider>
    );
}
