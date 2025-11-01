
'use client';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import type { Property } from '@/lib/data';

interface MarkAsSoldDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onConfirm: () => void;
}

export function MarkAsSoldDialog({ isOpen, onOpenChange, property, onConfirm }: MarkAsSoldDialogProps) {
  const [transactionValue, setTransactionValue] = useState(property.price);
  const [commissionPercent, setCommissionPercent] = useState(5); // Default commission
  const [commissionValue, setCommissionValue] = useState(0);

  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const isForSale = property.operation === 'Comprar';
  const newStatus = isForSale ? 'vendido' : 'alugado';

  useEffect(() => {
    // Recalculate commission whenever the value or percent changes
    const calculated = (transactionValue * commissionPercent) / 100;
    setCommissionValue(calculated);
  }, [transactionValue, commissionPercent]);

   useEffect(() => {
    // Reset transaction value when property changes
    setTransactionValue(property.price);
  }, [property]);

  const handleConfirm = async () => {
    if (!firestore || !user || !user.uid) {
      toast({ title: "Erro de autenticação", variant: "destructive" });
      return;
    }

    const docRef = doc(firestore, `agents/${user.uid}/properties`, property.id);
    
    updateDocumentNonBlocking(docRef, {
      status: newStatus,
      soldAt: serverTimestamp(),
      commissionValue: commissionValue,
    });

    toast({
      title: `Imóvel marcado como ${newStatus}!`,
      description: `${property.title} foi movido para a aba correspondente.`,
    });
    onConfirm();
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar como {newStatus}</AlertDialogTitle>
          <AlertDialogDescription>
            Confirme os detalhes da transação para o imóvel "{property.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-value">Valor Final da Transação (R$)</Label>
            <Input
              id="transaction-value"
              type="number"
              value={transactionValue}
              onChange={(e) => setTransactionValue(Number(e.target.value))}
              placeholder="Ex: 850000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-percent">Percentual de Comissão (%)</Label>
            <Input
              id="commission-percent"
              type="number"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(Number(e.target.value))}
              placeholder="Ex: 5"
            />
          </div>
           <div className="space-y-2 rounded-md bg-muted p-4">
            <p className="text-sm font-medium text-muted-foreground">Comissão Calculada</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(commissionValue)}</p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirm}>
                Confirmar e Marcar como {newStatus}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
