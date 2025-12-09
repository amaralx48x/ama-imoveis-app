'use client';

import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Agent } from '@/lib/data';

interface AgentMetadataProps {
  agentId?: string | null;
}

/**
 * Este componente busca os dados de um agente e aplica
 * o tema e o favicon ao `document`. Ele não renderiza nada visualmente.
 */
export function AgentMetadata({ agentId }: AgentMetadataProps) {
  const firestore = useFirestore();

  const agentRef = useMemoFirebase(
    () => (firestore && agentId ? doc(firestore, 'agents', agentId) : null),
    [firestore, agentId]
  );

  const { data: agentData } = useDoc<Agent>(agentRef);

  useEffect(() => {
    // Se não há dados do agente, não faz nada.
    if (!agentData) return;

    // Lógica para aplicar o tema
    const theme = agentData.siteSettings?.theme || 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    // Lógica para aplicar o favicon
    const faviconUrl = agentData.siteSettings?.faviconUrl;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Aplica o favicon do agente ou um padrão
    link.href = faviconUrl || '/favicon.ico';
    
  }, [agentData]);

  // Este componente não renderiza nada na tela.
  return null;
}
