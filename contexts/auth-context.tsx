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
      try {
        const authenticated = authService.isAuthenticated()
        setIsAuthenticated(authenticated)

        if (authenticated) {
          const userData = authService.getUserData()
          setUser(userData)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsAuthenticated(false)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Función de inicio de sesión
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.login(credentials)
      setIsAuthenticated(true)
      setUser(response.user || { username: credentials.username })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Función de registro
  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      await authService.register(credentials)
      // Iniciar sesión automáticamente después del registro
      await authService.login(credentials)
      setIsAuthenticated(true)
      setUser({ username: credentials.username })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar usuario")
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Función de cierre de sesión
  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
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
