
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportLeadsToXlsx(leads: any[], filename = "leads.xlsx") {
  // Normalize fields for export
  const rows = leads.map(l => ({
    id: l.id,
    name: l.name || l.nome || "",
    email: l.email || "",
    phone: l.phone || l.telefone || "",
    leadType: l.leadType || l.type || "",
    status: l.status || "",
    createdAt: l.createdAt?.toDate ? l.createdAt.toDate().toISOString() : (l.createdAt || ""),
    message: l.message || l.mensagem || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, filename);
}
