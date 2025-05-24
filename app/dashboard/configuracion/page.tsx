"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Save, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function ConfiguracionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "Usuario",
    newPassword: "",
    confirmPassword: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = () => {
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Configuración guardada",
        description: "Tus cambios han sido guardados correctamente.",
      })
    }, 1500)
  }

  const handleUpdatePassword = () => {
    setIsLoading(true)

    // Validación básica
    if (!formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente.",
      })

      // Limpiar campos de contraseña
      setFormData((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }))
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">Administra tu cuenta y preferencias.</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Perfil</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre de Usuario</Label>
                <Input id="nombre" value={formData.nombre} onChange={handleInputChange} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="seguridad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>Actualiza tu contraseña</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cambiar Contraseña</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={handleUpdatePassword} disabled={isLoading}>
                  <Lock className="mr-2 h-4 w-4" />
                  {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
