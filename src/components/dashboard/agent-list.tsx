'use client';

import type { Agent } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface AgentListProps {
  agents: Agent[];
  isLoading: boolean;
}

export function AgentList({ agents, isLoading }: AgentListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                         <Skeleton className="h-5 w-1/3" />
                         <Skeleton className="h-5 w-1/2" />
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users/> Corretores Registrados</CardTitle>
        <CardDescription>Lista de todos os corretores e imobiliárias na plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Nome do Corretor / Imobiliária</TableHead>
                <TableHead>ID do Usuário</TableHead>
                <TableHead>Plano</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {agents.map((agent) => (
                <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.displayName}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{agent.id}</TableCell>
                    <TableCell className="capitalize">{agent.plan || 'Corretor'}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
        {agents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum corretor encontrado.</p>
        )}
      </CardContent>
    </Card>
  );
}
