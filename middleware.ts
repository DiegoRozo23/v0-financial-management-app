import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard"]

// Rutas públicas (no requieren autenticación)
const publicRoutes = ["/", "/login", "/registro"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si hay token en localStorage (client-side)
  // Nota: En el middleware no podemos acceder a localStorage directamente
  // Por eso usamos cookies como respaldo
  const hasToken = request.cookies.has("accessToken")

  console.log(`🔍 Middleware - Ruta: ${pathname}, Token: ${hasToken ? "Presente" : "No presente"}`)

  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route)

  // Si es una ruta protegida y no está autenticado, redirigir a login
  if (isProtectedRoute && !hasToken) {
    console.log(`🚫 Middleware - Acceso denegado a ${pathname} - Redirigiendo a /login`)
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // Si está autenticado e intenta acceder a login o registro, redirigir a dashboard
  if (hasToken && (pathname === "/login" || pathname === "/registro")) {
    console.log(`🔄 Middleware - Usuario ya autenticado en ${pathname} - Redirigiendo a /dashboard`)
    const url = new URL("/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  console.log(`✅ Middleware - Acceso permitido a ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
