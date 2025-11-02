
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { detectLeadType, formatDate } from "@/lib/lead-utils";
import LeadModal from "@/components/lead-modal";
import { exportLeadsToXlsx } from "@/lib/export-leads";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";


type Props = {
  agentId: string;
};

export default function LeadsPage({ agentId }: Props) {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "seller" | "buyer" | "archived" | "visit">("unread");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [modalLead, setModalLead] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const firestore = useFirestore();
  const leadsRefPath = `agents/${agentId}/leads`;
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, leadsRefPath), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => {
        const data = d.data();
        const leadType = data.leadType || detectLeadType(data.message || data.mensagem || "", data.context);
        return { id: d.id, leadType, ...data };
      });
      setLeads(docs);
    }, (err) => {
      console.error("Erro ao escutar leads:", err);
      toast({title: "Erro ao carregar leads", variant: "destructive"})
    });

    return () => unsub();
  }, [agentId, firestore, toast, leadsRefPath]);

  // filtered list
  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (filter === "all") return l.status !== "archived";
      if (filter === "unread") return l.status === "unread";
      if (filter === "seller") return l.leadType === "seller" && l.status !== "archived";
      if (filter === "buyer") return l.leadType === "buyer" && l.status !== "archived" && l.context !== 'buyer:schedule-visit';
      if (filter === "visit") return l.context === 'buyer:schedule-visit' && l.status !== 'archived';
      if (filter === "archived") return l.status === "archived";
      return true;
    });
  }, [leads, filter]);

  useEffect(() => {
    // update selectAll toggle when filtered changes
    const allFilteredIds = filtered.map(f => f.id);
    if (selectAll && allFilteredIds.length > 0) {
      const map: Record<string, boolean> = {};
      allFilteredIds.forEach(id => (map[id] = true));
      setSelectedIds(map);
    } else if (!selectAll) {
        // Deselect all only if selectAll is unchecked
        const currentSelected = Object.keys(selectedIds);
        const filteredSelected = currentSelected.filter(id => allFilteredIds.includes(id));
        if(currentSelected.length !== filteredSelected.length) {
            const newSelection: Record<string, boolean> = {};
            filteredSelected.forEach(id => newSelection[id] = true);
            setSelectedIds(newSelection);
        }
    }
  }, [selectAll, filtered, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds({});
    setSelectAll(false);
  }

  async function bulkUpdate(newStatus: "read" | "archived" | "unread") {
    const ids = Object.keys(selectedIds);
    if (!ids.length) return toast({title: "Selecione pelo menos 1 lead.", variant: "destructive"});
    if (!firestore) return;

    try {
      const batch = writeBatch(firestore);
      for (const id of ids) {
        const ref = doc(firestore, leadsRefPath, id);
        batch.update(ref, { status: newStatus });
      }
      await batch.commit();
      clearSelection();
      toast({title: "Ação realizada com sucesso."});
    } catch (err) {
      console.error("Erro bulkUpdate:", err);
      toast({title: "Erro ao executar ação em massa.", variant: "destructive"});
    }
  }

  async function bulkDelete() {
    const ids = Object.keys(selectedIds);
    if (!ids.length) return toast({title: "Selecione pelo menos 1 lead.", variant: "destructive"});
    if (!window.confirm(`Excluir ${ids.length} lead(s)? Esta ação é irreversível.`)) return;
    if (!firestore) return;

    try {
       const batch = writeBatch(firestore);
      for (const id of ids) {
        batch.delete(doc(firestore, leadsRefPath, id));
      }
      await batch.commit();
      clearSelection();
      toast({title: "Leads excluídos."});
    } catch (err) {
      console.error("Erro bulkDelete:", err);
      toast({title: "Erro ao excluir leads.", variant: "destructive"});
    }
  }

  function openLeadModal(lead: any) {
    setModalLead(lead);
    setModalOpen(true);
  }

  async function handleUpdateStatus(id: string, newStatus: "read" | "archived" | "unread") {
     if (!firestore) return;
    try {
      setLoadingActionId(id);
      await updateDoc(doc(firestore, leadsRefPath, id), { status: newStatus });
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({title: "Erro ao atualizar status.", variant: "destructive"});
    } finally {
      setLoadingActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Deseja realmente excluir este lead?")) return;
    if (!firestore) return;
    try {
      setLoadingActionId(id);
      await deleteDoc(doc(firestore, leadsRefPath, id));
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({title: "Erro ao excluir lead.", variant: "destructive"});
    } finally {
      setLoadingActionId(null);
    }
  }

  function exportSelected() {
    const ids = Object.keys(selectedIds);
    if (!ids.length) return toast({title: "Selecione pelo menos 1 lead.", variant: "destructive"});
    const rows = leads.filter(l => ids.includes(l.id));
    exportLeadsToXlsx(rows, `leads_${new Date().toISOString().slice(0,10)}.xlsx`);
  }
  
  const numSelected = Object.keys(selectedIds).length;

  return (
    <div className="p-4 space-y-4">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
            <h2 className="text-2xl font-semibold">Lista de Leads</h2>
            <p className="text-muted-foreground">Gerencie seus contatos e oportunidades.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={(val) => setFilter(val as any)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="all">Caixa de Entrada</SelectItem>
                <SelectItem value="visit">Visitas Agendadas</SelectItem>
                <SelectItem value="seller">Proprietários</SelectItem>
                <SelectItem value="buyer">Compradores</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
        
        {numSelected > 0 && (
             <div className="flex items-center justify-between p-2 bg-muted rounded-md border">
                <span className="text-sm font-medium">{numSelected} selecionado(s)</span>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Ações em Massa <MoreHorizontal className="ml-2 h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => bulkUpdate("read")}>Marcar como Lida</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bulkUpdate("unread")}>Marcar como Não lida</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bulkUpdate("archived")}>Arquivar</DropdownMenuItem>
                        <DropdownMenuItem onClick={exportSelected}>Exportar para XLSX</DropdownMenuItem>
                        <DropdownMenuItem onClick={bulkDelete} className="text-destructive">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
        )}

      <div className="overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="p-2 w-12">
                 <Checkbox
                    checked={selectAll}
                    onCheckedChange={(checked) => setSelectAll(Boolean(checked))}
                />
              </TableHead>
              <TableHead className="p-2 text-left">Nome</TableHead>
              <TableHead className="p-2 text-left">Email / Telefone</TableHead>
              <TableHead className="p-2 text-left">Interesse</TableHead>
              <TableHead className="p-2 text-left">Data</TableHead>
              <TableHead className="p-2 text-left">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.map(lead => (
                <motion.tr key={lead.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`border-b transition-colors ${selectedIds[lead.id] ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                >
                  <TableCell className="p-2">
                    <Checkbox
                      checked={!!selectedIds[lead.id]}
                      onCheckedChange={() => toggleSelect(lead.id)}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <button className="text-left font-medium text-primary hover:underline" onClick={() => openLeadModal(lead)}>
                      {lead.name || "(sem nome)"}
                    </button>
                  </TableCell>
                  <TableCell className="p-2 text-sm text-muted-foreground">
                    <div>{lead.email || ""}</div>
                    <div>{lead.phone || ""}</div>
                  </TableCell>
                  <TableCell className="p-2">
                     <Badge variant={lead.context === 'buyer:schedule-visit' ? 'default' : lead.leadType === "seller" ? "destructive" : "secondary"}>
                         {lead.context === 'buyer:schedule-visit' ? 'Agendamento' : lead.leadType === "seller" ? "Proprietário" : lead.leadType === "buyer" ? "Comprador" : "Outro"}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-2 text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                  <TableCell className="p-2">
                    {lead.status === "unread" ? <Badge variant="default">Não lida</Badge> : 
                     lead.status === "read" ? <Badge variant="secondary">Lida</Badge> : 
                     <Badge variant="outline">Arquivada</Badge>}
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
             {filtered.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        Nenhum lead encontrado para este filtro.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>

      <LeadModal
        lead={modalLead}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onMarkRead={() => modalLead && handleUpdateStatus(modalLead.id, "read")}
        onArchive={() => modalLead && handleUpdateStatus(modalLead.id, "archived")}
        onDelete={() => modalLead && handleDelete(modalLead.id)}
      />
    </div>
  );
}
