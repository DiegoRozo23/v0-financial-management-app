"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  BarChart3,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  Settings,
  Target,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { logout, user } = useAuth()

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/dashboard",
    },
    {
      name: "Ingresos y Gastos",
      href: "/dashboard/ingresos-gastos",
      icon: CreditCard,
      current: pathname === "/dashboard/ingresos-gastos",
    },
    {
      name: "Ahorros",
      href: "/dashboard/ahorros",
      icon: PiggyBank,
      current: pathname === "/dashboard/ahorros",
    },
    {
      name: "Objetivos",
      href: "/dashboard/objetivos",
      icon: Target,
      current: pathname === "/dashboard/objetivos",
    },
    {
      name: "Reportes",
      href: "/dashboard/reportes",
      icon: BarChart3,
      current: pathname === "/dashboard/reportes",
    },
    {
      name: "Configuración",
      href: "/dashboard/configuracion",
      icon: Settings,
      current: pathname === "/dashboard/configuracion",
    },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center px-2">
              <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>FinanzApp</span>
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={item.current} tooltip={item.name}>
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.username || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground">Cuenta Personal</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <ThemeToggle />
                  <Button variant="ghost" size="icon" onClick={logout} title="Cerrar sesión">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Cerrar sesión</span>
                  </Button>
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
