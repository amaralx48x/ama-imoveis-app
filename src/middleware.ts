
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este matcher define em quais rotas o middleware será executado.
// A rota '/selecao-usuario' foi removida para não interferir no fluxo de login.
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
    '/usuarios/:path*',
  ],
}

export function middleware(request: NextRequest) {
  // A lógica de proteção de rotas (verificação de token/sessão) pode ser adicionada aqui no futuro.
  return NextResponse.next()
}
