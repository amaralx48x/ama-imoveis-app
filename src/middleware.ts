
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este matcher define em quais rotas o middleware será executado.
// Apenas rotas do painel (privadas) devem ser incluídas aqui.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/imoveis/:path*',
    '/contatos/:path*',
    '/inbox/:path*',
    '/avaliacoes/:path*',
    '/configuracoes/:path*',
    '/perfil/:path*',
    '/integracoes/:path*',
    '/meu-plano/:path*',
    '/admin/:path*',
    '/selecao-usuario',
  ],
}

export function middleware(request: NextRequest) {
  // A lógica de proteção de rotas (verificação de token/sessão) pode ser adicionada aqui no futuro.
  // Por enquanto, apenas o fato de ele rodar nessas rotas e não nas públicas já resolve o problema.
  return NextResponse.next()
}
