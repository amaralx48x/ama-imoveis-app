
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
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
