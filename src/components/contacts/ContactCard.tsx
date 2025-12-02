
'use client';
import React from "react";
import { deleteContact } from "@/firebase/contacts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, Edit, Trash2, User, Building } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Contact } from "@/lib/data";
import { Badge } from "../ui/badge";

interface ContactCardProps {
    contact: Contact;
    onEdit: () => void;
    agentId: string;
}


export default function ContactCard({ contact, onEdit, agentId }: ContactCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o contato "${contact.name}"?`)) return;
    try {
        await deleteContact(agentId, contact.id);
        toast({ title: "Contato excluído!" });
    } catch (err) {
        console.error(err);
        toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  }

  return (
    <div className="p-4 border rounded-lg flex justify-between items-center bg-card hover:bg-muted/50 transition-colors">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
            <h4 className="font-bold text-base">{contact.name}</h4>
            <Badge variant={contact.type === 'owner' ? 'outline' : 'secondary'}>
                {contact.type === 'owner' ? <Building className="mr-1 h-3 w-3"/> : <User className="mr-1 h-3 w-3" />}
                {contact.type === 'owner' ? 'Proprietário' : 'Cliente'}
            </Badge>
        </div>
        <div className="text-sm text-muted-foreground">{contact.phone} {contact.phone && contact.email && '•'} {contact.email}</div>
        <div className="text-xs text-muted-foreground">Propriedades vinculadas: {contact.linkedPropertyIds?.length || 0}</div>
      </div>
      <div className="flex gap-2">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4"/>
                    Editar
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
    </div>
  );
}
