import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar se está acessando rota protegida
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Verificar se tem token de autenticação
    const token = request.cookies.get('sb-access-token')
    
    if (!token) {
      // Redirecionar para login se não estiver autenticado
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
