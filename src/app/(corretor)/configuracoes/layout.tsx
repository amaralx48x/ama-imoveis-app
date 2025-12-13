'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePathname, useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import Link from 'next/link';

const tabs = [
    { path: '/configuracoes/aparencia', label: 'Aparência Geral' },
    { path: '/configuracoes/aparencia/cores', label: 'Cores' },
    { path: '/configuracoes/links', label: 'Links e Exibição' },
    { path: '/configuracoes/secoes', label: 'Seções' },
    { path: '/configuracoes/sites-extras', label: 'Sites Extras' },
    { path: '/configuracoes/seo', label: 'SEO' },
    { path: '/configuracoes/metricas', label: 'Métricas' },
    { path: '/configuracoes/politicas', label: 'Políticas' },
];

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    // Determine the base path for settings
    const getActiveTab = () => {
        // Find the most specific match first
        const specificMatch = tabs.find(tab => pathname === tab.path);
        if (specificMatch) return specificMatch.path;

        // Fallback to the parent section
        const parentMatch = tabs.find(tab => pathname.startsWith(tab.path));
        return parentMatch ? parentMatch.path : '/configuracoes/aparencia';
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Settings /> Configurações
                </h1>
                <p className="text-muted-foreground">
                    Ajuste a aparência, comportamento e informações do seu site público e painel.
                </p>
            </div>
            
            <Tabs value={getActiveTab()} onValueChange={(value) => router.push(value)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto">
                    {tabs.map(tab => (
                         <TabsTrigger key={tab.path} value={tab.path} asChild>
                            <Link href={tab.path}>{tab.label}</Link>
                         </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
            
            <div className="pt-4">
                {children}
            </div>
        </div>
    );
}
