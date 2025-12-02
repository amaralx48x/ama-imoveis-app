
"use client";
import React, { useState, useEffect } from "react";
import { createContact, updateContact } from "@/firebase/contacts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import type { Contact } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";

interface ContactFormModalProps {
    open: boolean;
    onClose: () => void;
    agentId: string | null;
    initialData?: Contact | null;
}

const defaultFormState: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'linkedPropertyIds'> = {
    name: "", cpf: "", phone: "", email: "", age: undefined, notes: "", type: "owner"
};

export default function ContactFormModal({ open, onClose, agentId, initialData=null }: ContactFormModalProps) {
  const [form, setForm] = useState(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    if (initialData) {
        setForm({
            name: initialData.name || "",
            cpf: initialData.cpf || "",
            phone: initialData.phone || "",
            email: initialData.email || "",
            age: initialData.age || undefined,
            notes: initialData.notes || "",
            type: initialData.type || "owner"
        });
    } else {
        setForm(defaultFormState);
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm(prev => ({...prev, [name]: value}));
  }
   const handleTypeChange = (value: "owner" | "client" | "inquilino") => {
      setForm(prev => ({ ...prev, type: value }));
  };

  const save = async () => {
    if (!agentId || !firestore) return toast({title: "Erro de autenticação", variant: "destructive"});
    if (!form.name.trim()) return toast({title: "O nome é obrigatório", variant: "destructive"});
    
    setIsSubmitting(true);
    const payload: Partial<Contact> = { 
        ...form, 
        age: form.age ? Number(form.age) : undefined,
    };
    try {
        if (initialData?.id) {
            await updateContact(firestore, agentId, initialData.id, payload);
             toast({ title: "Contato atualizado!" });
        } else {
            await createContact(firestore, agentId, payload);
            toast({ title: "Contato criado com sucesso!" });
        }
        onClose();
    } catch(err) {
        console.error(err);
        toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px]">
             <DialogHeader>
                <DialogTitle>{initialData ? "Editar Contato" : "Novo Contato"}</DialogTitle>
                <DialogDescription>
                    Preencha as informações do seu contato. Apenas o nome é obrigatório.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tipo</Label>
                    <RadioGroup defaultValue="owner" className="col-span-3 flex gap-4" onValueChange={handleTypeChange} value={form.type}>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="owner" id="r-owner" />
                            <Label htmlFor="r-owner">Proprietário</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="client" id="r-client" />
                            <Label htmlFor="r-client">Cliente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="inquilino" id="r-tenant" />
                            <Label htmlFor="r-tenant">Inquilino</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome*</Label>
                    <Input id="name" name="name" placeholder="Nome Completo" value={form.name} onChange={handleChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cpf" className="text-right">CPF</Label>
                    <Input id="cpf" name="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Telefone</Label>
                    <Input id="phone" name="phone" placeholder="(11) 99999-9999" value={form.phone} onChange={handleChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" name="email" placeholder="contato@email.com" value={form.email} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="age" className="text-right">Idade</Label>
                    <Input id="age" name="age" type="number" placeholder="42" value={form.age || ''} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">Notas</Label>
                    <Textarea id="notes" name="notes" placeholder="Observações internas sobre o contato..." value={form.notes} onChange={handleChange} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={save} disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
