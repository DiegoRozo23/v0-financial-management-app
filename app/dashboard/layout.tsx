"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  DollarSign,
  Home,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  Target,
  User,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { logout, user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Verificar autenticación al cargar
  useEffect(() => {
    // We'll rely on the auth context instead of directly checking localStorage
    if (!isAuthenticated && !isLoading) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      exact: true,
    },
    {
      href: "/dashboard/ingresos-gastos",
      label: "Ingresos y Gastos",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      href: "/dashboard/ahorros",
      label: "Ahorros",
      icon: <PiggyBank className="h-5 w-5" />,
    },
    {
      href: "/dashboard/objetivos",
      label: "Objetivos",
      icon: <Target className="h-5 w-5" />,
    },
    {
      href: "/dashboard/reportes",
      label: "Reportes",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      href: "/dashboard/configuracion",
      label: "Configuración",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:max-w-xs">
            <div className="flex h-full flex-col">
              <div className="flex items-center border-b py-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span>FinanzApp</span>
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="grid gap-2 p-4 flex-1">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                      isActive(route.href, route.exact)
                        ? "bg-green-100 text-green-900 dark:bg-green-800 dark:text-green-50"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {route.icon}
                    {route.label}
                  </Link>
                ))}
                <div className="mt-auto border-t pt-4">
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          <span className="hidden md:inline">FinanzApp</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-green-600">3</Badge>
                <span className="sr-only">Notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-auto">
                {[1, 2, 3].map((i) => (
                  <DropdownMenuItem key={i} className="cursor-pointer p-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium">Alerta de presupuesto</div>
                      <div className="text-sm text-muted-foreground">
                        Has superado el 80% de tu presupuesto mensual en la categoría "Entretenimiento".
                      </div>
                      <div className="text-xs text-muted-foreground">Hace 2 horas</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={user?.username || "Usuario"} />
                  <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-flex">{user?.username || "Usuario"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 md:block sticky top-16 h-[calc(100vh-4rem)] overflow-auto">
          <nav className="grid gap-2 p-4 flex-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  isActive(route.href, route.exact)
                    ? "bg-green-100 text-green-900 dark:bg-green-800 dark:text-green-50"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
            <div className="mt-auto border-t pt-4">
              <ThemeToggle />
            </div>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
