
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { InfoCard } from '@/components/info-card';

export default function ContactsPage() {
  return (
    <div className="space-y-6">
       <InfoCard cardId="contatos-info" title="Gerenciamento de Contatos">
          <p>
            Esta seção está em desenvolvimento. Em breve, você poderá cadastrar, organizar e vincular seus contatos (proprietários e clientes) diretamente aos seus imóveis.
          </p>
          <p>
            Isso facilitará o controle de quem são os donos das propriedades e quais clientes estão interessados em cada uma delas.
          </p>
        </InfoCard>
       <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2">
            <Wrench /> Contatos
          </CardTitle>
          <CardDescription>
            Gerencie sua carteira de proprietários e clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center py-16 rounded-lg border-2 border-dashed">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-bold mt-4">Página em Construção</h2>
                <p className="text-muted-foreground mt-2">
                   Estamos trabalhando para aprimorar esta seção. Em breve, ela estará disponível.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
