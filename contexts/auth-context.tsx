"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authService, type LoginCredentials, type RegisterCredentials, type UserData } from "@/services/auth-service"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserData | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const router = useRouter()

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      console.log("🔍 Verificando autenticación en AuthProvider")

      try {
        const authenticated = authService.isAuthenticated()
        console.log(`🔐 Estado de autenticación: ${authenticated ? "Autenticado" : "No autenticado"}`)

        setIsAuthenticated(authenticated)

        if (authenticated) {
          // Obtener información del usuario si está autenticado
          const userData = authService.getUserData()
          console.log("👤 Datos de usuario recuperados:", userData)
          setUser(userData)
        }
      } catch (err) {
        console.error("❌ Error al verificar autenticación:", err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Función de inicio de sesión
  const login = async (credentials: LoginCredentials) => {
    console.log("🔑 Iniciando proceso de login")
    setIsLoading(true)
    setError(null)

    try {
      const userData = await authService.login(credentials)
      console.log("✅ Login exitoso:", userData)

      setIsAuthenticated(true)
      setUser(userData)

      console.log("🔄 Redirigiendo a /dashboard")
      router.push("/dashboard")
    } catch (err) {
      console.error("❌ Error en login:", err)
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Función de registro
  const register = async (credentials: RegisterCredentials) => {
    console.log("📝 Iniciando proceso de registro")
    setIsLoading(true)
    setError(null)

    try {
      await authService.register(credentials)
      console.log("✅ Registro exitoso, iniciando sesión automática")

      // Iniciar sesión automáticamente después del registro
      const userData = await authService.login(credentials)
      setIsAuthenticated(true)
      setUser(userData)

      console.log("🔄 Redirigiendo a /dashboard")
      router.push("/dashboard")
    } catch (err) {
      console.error("❌ Error en registro:", err)
      setError(err instanceof Error ? err.message : "Error al registrar usuario")
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Función de cierre de sesión
  const logout = () => {
    console.log("🚪 Iniciando proceso de logout")
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)

    console.log("🔄 Redirigiendo a /login")
    router.push("/login")
  }

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
