
export type LeadType = "seller" | "buyer" | "other";

export function detectLeadType(message: string | null | undefined, context?: string): LeadType {
  const text = (message || "").toLowerCase();

  // context can be e.g. "form:captacao" or "ad:imovel" - pass if available
  if (context) {
    const ctx = context.toLowerCase();
    if (ctx.includes("captacao") || ctx.includes("vender") || ctx.includes("owner") || ctx.includes("anuncie")) return "seller";
    if (ctx.includes("interesse") || ctx.includes("comprar") || ctx.includes("alugar")) return "buyer";
  }

  // keyword rules
  const sellerKeywords = ["vender", "colocar meu imóvel", "venda", "anunciar meu", "quero vender", "colocar à venda", "anuncie"];
  const buyerKeywords = ["comprar", "interesse", "gostaria de comprar", "quero alugar", "alugar", "procuro"];

  if (sellerKeywords.some(k => text.includes(k))) return "seller";
  if (buyerKeywords.some(k => text.includes(k))) return "buyer";
  return "other";
}

export function formatDate(timestamp: any) {
  if (!timestamp) return "";
  if (timestamp.toDate) return timestamp.toDate().toLocaleString('pt-BR');
  return new Date(timestamp).toLocaleString('pt-BR');
}
