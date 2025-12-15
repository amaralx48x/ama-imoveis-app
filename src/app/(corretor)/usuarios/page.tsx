
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HardHat, Users } from 'lucide-react';

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline flex items-center gap-2"><Users/> Gerenciar Usuários</CardTitle>
          <CardDescription>Adicione, edite ou remova os corretores que têm acesso a este painel.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-24 rounded-lg border-2 border-dashed">
                <HardHat className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="text-2xl font-bold mt-4">Em Construção</h2>
                <p className="text-muted-foreground mt-2">
                   A funcionalidade de múltiplos usuários está sendo preparada e será liberada em breve.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
