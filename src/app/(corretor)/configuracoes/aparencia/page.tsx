
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
import { Palette } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function SettingToggle({ id, label, description, isChecked, onCheckedChange, isLoading }: { id: string, label: string, description: string, isChecked: boolean, onCheckedChange: (checked: boolean) => void, isLoading: boolean }) {
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
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
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

    const handleSettingChange = (key: string) => (value: boolean) => {
        if (!agentRef) return;
        
        const updatePath = `siteSettings.${key}`;
        setDocumentNonBlocking(agentRef, { [updatePath]: value }, { merge: true });

        toast({
            title: "Configuração atualizada!",
            description: "A mudança será refletida no seu site público."
        });
    };

    const siteSettings = agentData?.siteSettings;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Palette/> Aparência do Site</CardTitle>
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
                            description="Exibe um botão na página de detalhes do imóvel para simular o financiamento."
                            isChecked={siteSettings?.showFinancing ?? true}
                            onCheckedChange={handleSettingChange('showFinancing')}
                            isLoading={isAgentLoading}
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
