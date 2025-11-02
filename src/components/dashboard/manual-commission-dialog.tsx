
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Plus, Minus } from 'lucide-react';

interface ManualCommissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
}

export function ManualCommissionDialog({ isOpen, onOpenChange, agentId }: ManualCommissionDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [reason, setReason] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');

  const handleConfirm = async () => {
    if (!adjustmentValue || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o valor e o motivo.",
        variant: "destructive"
      });
      return;
    }
    if (!firestore) return;

    const docRef = doc(firestore, `agents`, agentId);
    
    const valueToStore = operation === 'subtract' ? -Math.abs(adjustmentValue) : Math.abs(adjustmentValue);

    updateDocumentNonBlocking(docRef, {
      "siteSettings.manualCommissionAdjustments": arrayUnion({
        value: valueToStore,
        reason: reason,
        createdAt: serverTimestamp(),
      }),
    });

    toast({
      title: 'Ajuste salvo!',
      description: 'O ajuste manual foi registrado com sucesso.',
    });
    
    // Reset state and close dialog
    setAdjustmentValue(0);
    setReason('');
    setOperation('add');
    onOpenChange(false);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numberValue = Number(rawValue) / 100;
    setAdjustmentValue(numberValue);
    e.target.value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste Manual de Comissão</DialogTitle>
          <DialogDescription>
            Adicione ou subtraia um valor do total de comissões do mês. Isso é útil para correções ou valores não vinculados a um imóvel específico.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">

          <div className="space-y-2">
            <Label htmlFor="operation">Operação</Label>
            <ToggleGroup 
              type="single" 
              value={operation} 
              onValueChange={(value) => {if (value) setOperation(value as 'add' | 'subtract')}}
              className="justify-start"
            >
              <ToggleGroupItem value="add" aria-label="Adicionar">
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </ToggleGroupItem>
              <ToggleGroupItem value="subtract" aria-label="Subtrair">
                <Minus className="h-4 w-4 mr-2" /> Subtrair
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment-value">Valor do Ajuste (R$)</Label>
             <Input
                id="adjustment-value"
                type="text"
                placeholder="R$ 0,00"
                onChange={handleValueChange}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Ajuste</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Bônus de meta, estorno, etc."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConfirm}>Salvar Ajuste</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

