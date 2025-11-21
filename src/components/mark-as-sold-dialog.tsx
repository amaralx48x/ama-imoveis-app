
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
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Agent, Property } from '@/lib/data';

interface MarkAsSoldDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onConfirm: () => void;
}

export function MarkAsSoldDialog({ isOpen, onOpenChange, property, onConfirm }: MarkAsSoldDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const agentRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'agents', user.uid) : null),
    [firestore, user]
  );
  const { data: agentData } = useDoc<Agent>(agentRef);
  
  const isForSale = property.operation === 'Venda';
  const newStatus = isForSale ? 'vendido' : 'alugado';

  const defaultCommission = isForSale 
    ? (agentData?.siteSettings?.defaultSaleCommission ?? 5)
    : (agentData?.siteSettings?.defaultRentCommission ?? 100);

  const [transactionValue, setTransactionValue] = useState(property.price);
  const [commissionPercent, setCommissionPercent] = useState(defaultCommission);
  const [commissionValue, setCommissionValue] = useState(0);

  useEffect(() => {
    // When the dialog opens or property changes, reset the state
    setTransactionValue(property.price);
    setCommissionPercent(defaultCommission);
  }, [isOpen, property, defaultCommission]);

  useEffect(() => {
    // Recalculate commission whenever the value or percent changes
    const calculated = (transactionValue * commissionPercent) / 100;
    setCommissionValue(calculated);
  }, [transactionValue, commissionPercent]);

  const handleConfirm = async () => {
    if (!firestore || !user || !user.uid) {
      toast({ title: "Erro de autenticação", variant: "destructive" });
      return;
    }

    const docRef = doc(firestore, `agents/${user.uid}/properties`, property.id);
    
    try {
        await updateDoc(docRef, {
            status: newStatus,
            soldAt: serverTimestamp(),
            commissionValue: commissionValue,
        });

        toast({
        title: `Imóvel marcado como ${newStatus}!`,
        description: `${property.title} foi movido para a aba correspondente.`,
        });
        onConfirm();
    } catch (error) {
        console.error("Erro ao marcar imóvel:", error);
        toast({
            title: "Erro ao atualizar",
            description: "Não foi possível atualizar o status do imóvel.",
            variant: "destructive"
        })
    }
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
             {isForSale ? (
                <p className="text-xs text-muted-foreground">O valor padrão para venda é {agentData?.siteSettings?.defaultSaleCommission ?? 5}%.</p>
             ) : (
                <p className="text-xs text-muted-foreground">O valor padrão para aluguel é {agentData?.siteSettings?.defaultRentCommission ?? 100}% do primeiro mês.</p>
             )}
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
