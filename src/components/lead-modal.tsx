
"use client";
import React from "react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/lead-utils";
import { Button } from "./ui/button";

type Props = {
  lead: any | null;
  open: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function LeadModal({ lead, open, onClose, onMarkRead, onArchive, onDelete }: Props) {
  if (!open || !lead) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-card rounded-lg shadow-lg max-w-2xl w-full p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold">{lead.name || lead.nome || "Sem nome"}</h3>
            <p className="text-sm text-muted-foreground">{lead.email}</p>
            <p className="text-sm text-muted-foreground">{lead.phone || lead.telefone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</p>
            <p className="text-sm capitalize">{lead.leadType || lead.type || "other"}</p>
          </div>
        </div>

        <hr className="my-4" />
        <div className="mb-4">
          <p className="whitespace-pre-line text-muted-foreground">{lead.message || lead.mensagem || ""}</p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={() => onMarkRead(lead.id)}>Marcar como lida</Button>
          <Button onClick={() => onArchive(lead.id)}>Arquivar</Button>
          <Button variant="destructive" onClick={() => onDelete(lead.id)}>Excluir</Button>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
