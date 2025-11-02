
export type LeadType = "seller" | "buyer" | "other";

export function detectLeadType(message: string | null | undefined, context?: string): LeadType {
  const text = (message || "").toLowerCase();

  // context can be e.g. "form:captacao" or "ad:imovel" - pass if available
  if (context) {
    const ctx = context.toLowerCase();
    if (ctx.includes("captacao") || ctx.includes("vender") || ctx.includes("owner") || ctx.includes("anuncie")) return "seller";
    if (ctx.includes("interesse") || ctx.includes("comprar") || ctx.includes("alugar") || ctx.includes("schedule-visit")) return "buyer";
  }

  // keyword rules
  const sellerKeywords = ["vender", "colocar meu imóvel", "venda", "anunciar meu", "quero vender", "colocar à venda", "anuncie"];
  const buyerKeywords = ["comprar", "interesse", "gostaria de comprar", "quero alugar", "alugar", "procuro", "agendar"];

  if (sellerKeywords.some(k => text.includes(k))) return "seller";
  if (buyerKeywords.some(k => text.includes(k))) return "buyer";
  return "other";
}

export function formatDate(timestamp: any) {
  if (!timestamp) return "";
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  if (timestamp.toDate) return timestamp.toDate().toLocaleString('pt-BR', options);
  return new Date(timestamp).toLocaleString('pt-BR', options);
}
