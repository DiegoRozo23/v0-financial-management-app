"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Función para actualizar información de depuración
  useEffect(() => {
    const updateDebugInfo = () => {
      const info = {
        localStorage: {
          accessToken: localStorage.getItem("accessToken") ? "Presente" : "No presente",
          refreshToken: localStorage.getItem("refreshToken") ? "Presente" : "No presente",
          userData: localStorage.getItem("userData"),
        },
        auth: {
          isLoading,
          error,
        },
        navigator: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      }
      setDebugInfo(info)
      console.log("🔍 Información de depuración:", info)
    }

    updateDebugInfo()
    // Actualizar cada segundo para ver cambios
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [isLoading, error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📝 Formulario enviado:", { ...formData, password: "***" })

    try {
      await login(formData)
    } catch (err) {
      console.error("❌ Error al iniciar sesión:", err)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span>FinanzApp</span>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">Ingresa tus credenciales para acceder a tu cuenta</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input id="username" value={formData.username} onChange={handleChange} placeholder="usuario1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                </Button>
              </div>
              <div className="text-right">
                <Link href="/recuperar-password" className="text-sm text-green-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {/* Información de depuración */}
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
              <details>
                <summary className="cursor-pointer font-medium">Información de depuración</summary>
                <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
            <div className="text-center text-sm">
              ¿No tienes una cuenta?{" "}
              <Link href="/registro" className="text-green-600 hover:underline">
                Regístrate
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
