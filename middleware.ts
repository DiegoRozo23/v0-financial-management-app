import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard"]

// Rutas públicas (no requieren autenticación)
const publicRoutes = ["/", "/login", "/registro"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.has("accessToken")

  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route)

  // Si es una ruta protegida y no está autenticado, redirigir a login
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/login", request.url)
    return NextResponse.redirect(url)
  }

  // Si está autenticado e intenta acceder a login o registro, redirigir a dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/registro")) {
    const url = new URL("/dashboard", request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
