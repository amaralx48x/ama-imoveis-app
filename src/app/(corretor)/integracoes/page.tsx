'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Copy, Rss } from "lucide-react";
import { InfoCard } from '@/components/info-card';
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const portals = [
  { id: 'zap', name: 'ZAP+ (ZAP, VivaReal, OLX)' },
  { id: 'imovelweb', name: 'Imovelweb' },
  { id: 'casamineira', name: 'Casa Mineira (Mercado Livre)' },
  { id: 'chavesnamao', name: 'Chaves na Mão' },
  { id: 'tecimob', name: 'Tecimob' },
];

export default function IntegracoesPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const handleCopy = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({
            title: "URL Copiada!",
            description: "Cole este link no painel do portal correspondente.",
        });
    };

  return (
    <div className="space-y-6">
       <InfoCard cardId="integracoes-info" title="Integração com Portais (Feed XML)">
          <p>
            Esta página gera links (feeds XML) que você pode usar para publicar seus imóveis automaticamente nos principais portais imobiliários do Brasil.
          </p>
          <p>
            Para cada portal, copie a URL correspondente e cole-a na seção "Integração" ou "Feed de imóveis" do painel administrativo daquele portal. Lembre-se que apenas imóveis marcados para publicação em um portal específico aparecerão no respectivo feed.
          </p>
        </InfoCard>
       <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Rss /> Integrações e Feeds XML
          </CardTitle>
          <CardDescription>
            Use os links abaixo para integrar seus imóveis com os portais parceiros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {user && portals.map(portal => {
                const feedUrl = `${baseUrl}/api/feed/${portal.id}?agentId=${user.uid}`;
                return (
                    <div key={portal.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/50">
                        <div className="flex-1">
                            <p className="font-semibold text-lg">{portal.name}</p>
                            <p className="text-sm text-muted-foreground font-mono break-all">{feedUrl}</p>
                        </div>
                        <Button variant="outline" size="icon" onClick={() => handleCopy(feedUrl)} aria-label={`Copiar URL para ${portal.name}`}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                )
            })}
        </CardContent>
      </Card>
    </div>
  );
}

  