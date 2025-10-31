
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Agent } from '@/lib/data';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { SlidersHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useCallback } from 'react';

function SettingToggle({ 
    id, 
    label, 
    description, 
    isChecked, 
    onCheckedChange, 
    isLoading,
    linkValue,
    onLinkChange,
    linkPlaceholder
}: { 
    id: string, 
    label: string, 
    description: string, 
    isChecked: boolean, 
    onCheckedChange: (checked: boolean) => void, 
    isLoading: boolean,
    linkValue?: string,
    onLinkChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
    linkPlaceholder?: string
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
            </div>
        )
    }
    
    return (
        <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between space-x-2">
                <div className="flex flex-col space-y-1.5">
                    <Label htmlFor={id} className="text-base font-medium">{label}</Label>
                    <p id={`${id}-description`} className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                <Switch
                    id={id}
                    checked={isChecked}
                    onCheckedChange={onCheckedChange}
                    aria-describedby={`${id}-description`}
                />
            </div>
            {onLinkChange && (
                 <div className="space-y-2">
                    <Label htmlFor={`${id}-link`} className="text-sm font-medium">Link Personalizado</Label>
                    <Input
                        id={`${id}-link`}
                        type="url"
                        placeholder={linkPlaceholder || "https://seu-link.com"}
                        value={linkValue}
                        onChange={onLinkChange}
                        disabled={!isChecked}
                        className="text-sm"
                    />
                     <p className="text-xs text-muted-foreground">Insira o link completo (ex: WhatsApp, página de financiamento, etc).</p>
                </div>
            )}
        </div>
    )
}

export default function AparênciaPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const agentRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, 'agents', user.uid) : null),
        [user, firestore]
    );

    const { data: agentData, isLoading: isAgentLoading } = useDoc<Agent>(agentRef);
    const [financingLink, setFinancingLink] = useState(agentData?.siteSettings?.financingLink || '');

     useEffect(() => {
        if (agentData?.siteSettings?.financingLink) {
            setFinancingLink(agentData.siteSettings.financingLink);
        }
    }, [agentData]);

    const handleSettingChange = (key: string) => (value: boolean | string) => {
        if (!agentRef) return;
        
        const updatePath = `siteSettings.${key}`;
        setDocumentNonBlocking(agentRef, { [updatePath]: value }, { merge: true });

        toast({
            title: "Configuração atualizada!",
            description: "A mudança será refletida no seu site público."
        });
    };

    const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFinancingLink(e.target.value);
        handleSettingChange('financingLink')(e.target.value);
    }

    const siteSettings = agentData?.siteSettings;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><SlidersHorizontal/> Controle de Exibição</CardTitle>
                <CardDescription>
                    Controle quais seções e elementos aparecem no seu site público. As alterações são salvas automaticamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                     <h3 className="text-xl font-bold font-headline mb-4">Seções da Página de Imóveis</h3>
                     <div className="space-y-4">
                        <SettingToggle
                            id="showFinancing"
                            label="Botão 'Simular Financiamento'"
                            description="Exibe um botão na página de detalhes do imóvel para uma ação personalizada."
                            isChecked={siteSettings?.showFinancing ?? true}
                            onCheckedChange={handleSettingChange('showFinancing')}
                            isLoading={isAgentLoading}
                            linkValue={financingLink}
                            onLinkChange={handleLinkChange}
                            linkPlaceholder="https://wa.me/5511999999999"
                        />
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h3 className="text-xl font-bold font-headline mb-4">Seções da Página Principal</h3>
                    <div className="space-y-4">
                        <SettingToggle
                            id="showReviews"
                            label="Seção de Avaliações de Clientes"
                            description="Mostra o carrossel com as avaliações e depoimentos dos seus clientes."
                            isChecked={siteSettings?.showReviews ?? true}
                            onCheckedChange={handleSettingChange('showReviews')}
                            isLoading={isAgentLoading}
                        />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
