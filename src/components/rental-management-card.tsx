
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Property, Contact } from '@/lib/data';
import { Calendar, FileText, User, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RentalManagementCardProps {
  property: Property;
  tenant?: Contact | null;
}


export default function RentalManagementCard({ property, tenant }: RentalManagementCardProps) {
  const rentalDetails = property.rentalDetails;
  
  const formatDate = (date: any) => {
    if (!date) return 'Não definida';
    const d = date.toDate ? date.toDate() : new Date(date);
    return format(d, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  if (!rentalDetails) {
    return (
        <Card className="bg-muted/30 border-dashed">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="text-primary"/>
                    Gestão do Aluguel
                </CardTitle>
                <CardDescription>
                Este imóvel está alugado, mas os detalhes do contrato ainda não foram preenchidos.
                </CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground">
                    Para habilitar a gestão, edite o imóvel e preencha as informações na seção "Detalhes do Aluguel".
                </p>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="text-primary"/>
            Gestão do Aluguel
        </CardTitle>
        <CardDescription>
          Controle o contrato, pagamentos e detalhes do imóvel alugado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                    <div className="text-xs text-muted-foreground">Início do Contrato</div>
                    <div className="font-semibold">{formatDate(rentalDetails.startDate)}</div>
                </div>
            </div>
             <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                    <div className="text-xs text-muted-foreground">Fim do Contrato</div>
                    <div className="font-semibold">{formatDate(rentalDetails.endDate)}</div>
                </div>
            </div>
             <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                    <div className="text-xs text-muted-foreground">Inquilino</div>
                    <div className="font-semibold">{tenant?.name || 'Não informado'}</div>
                </div>
            </div>
        </div>
        
        <Separator />

        <div>
            <h4 className="font-semibold mb-2">Histórico de Pagamentos (Exemplo)</h4>
             <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rentalDetails.paymentHistory?.map((payment, index) => (
                             <TableRow key={index} className={payment.status === 'pendente' ? 'bg-yellow-500/10' : ''}>
                                <TableCell>{formatDate(payment.dueDate)}</TableCell>
                                <TableCell>{formatCurrency(payment.value)}</TableCell>
                                <TableCell>
                                    <Badge variant={payment.status === 'pago' ? 'secondary' : (payment.status === 'pendente' ? 'default' : 'destructive')}>
                                        {payment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm">
                                        <Receipt className="w-3 h-3 mr-1.5"/>
                                        Gerar 2ª Via
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!rentalDetails.paymentHistory && (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum histórico de pagamento registrado.</TableCell>
                             </TableRow>
                         )}
                    </TableBody>
                </Table>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
