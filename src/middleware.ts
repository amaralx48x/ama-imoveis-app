
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este matcher define em quais rotas o middleware será executado.
// Estamos configurando para ele rodar em todas as rotas, exceto nas rotas da API
// (especialmente a do webhook) e em arquivos estáticos.
export const config = {
  matcher: [
    /*
     * Combine todas as rotas exceto as que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export function middleware(request: NextRequest) {
  // Se você tiver uma lógica de proteção de rotas (ex: redirecionar para /login
  // se o usuário não estiver autenticado), ela iria aqui.
  
  // No nosso caso, o simples fato de o matcher acima *excluir* a rota /api
  // já resolve o problema do webhook do Stripe, pois o middleware não será
  // mais executado para essa rota, evitando o redirecionamento indevido.

  return NextResponse.next()
}
