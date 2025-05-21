"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Lock, Save, User, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function ConfiguracionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const [formData, setFormData] = useState({
    nombre: "Usuario",
    apellido: "Ejemplo",
    email: "usuario@ejemplo.com",
    telefono: "+57 300 123 4567",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
    resumenSemanal: true,
    alertasPresupuesto: true,
    consejosFinancieros: false,
    transaccionesNuevas: true,
    objetivosAlcanzados: true,
    recordatoriosPago: true,
    tema: theme || "light",
    moneda: "COP",
    idioma: "es",
    formatoExportacion: "csv",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSwitchChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [id]: checked }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))

    if (id === "tema") {
      setTheme(value)
    }
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
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
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
        currentPassword: "",
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
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="preferencias">Preferencias</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información de Perfil</CardTitle>
              <CardDescription>Actualiza tu información personal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder-user.jpg" alt="Usuario" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Foto de Perfil</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Cambiar Foto
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={formData.nombre} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" value={formData.apellido} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} />
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
              <CardDescription>Actualiza tu contraseña y configuración de seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cambiar Contraseña</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                    />
                  </div>
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
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleUpdatePassword} disabled={isLoading}>
                  <Lock className="mr-2 h-4 w-4" />
                  {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Autenticación de Dos Factores</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activar 2FA</Label>
                    <p className="text-sm text-muted-foreground">Protege tu cuenta con autenticación de dos factores</p>
                  </div>
                  <Switch
                    checked={formData.twoFactor}
                    onCheckedChange={(checked) => handleSwitchChange("twoFactor", checked)}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sesiones Activas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Este dispositivo</p>
                      <p className="text-sm text-muted-foreground">Última actividad: Hace 2 minutos</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Cerrar Sesión
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">iPhone 13 - Safari</p>
                      <p className="text-sm text-muted-foreground">Última actividad: Hace 2 días</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Configura cómo y cuándo quieres recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notificaciones por Correo</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Resumen Semanal</Label>
                      <p className="text-sm text-muted-foreground">Recibe un resumen semanal de tus finanzas</p>
                    </div>
                    <Switch
                      checked={formData.resumenSemanal}
                      onCheckedChange={(checked) => handleSwitchChange("resumenSemanal", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Presupuesto</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones cuando te acerques a tu límite de presupuesto
                      </p>
                    </div>
                    <Switch
                      checked={formData.alertasPresupuesto}
                      onCheckedChange={(checked) => handleSwitchChange("alertasPresupuesto", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Consejos Financieros</Label>
                      <p className="text-sm text-muted-foreground">Recibe consejos para mejorar tus finanzas</p>
                    </div>
                    <Switch
                      checked={formData.consejosFinancieros}
                      onCheckedChange={(checked) => handleSwitchChange("consejosFinancieros", checked)}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notificaciones en la Aplicación</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Transacciones Nuevas</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones cuando se registren nuevas transacciones
                      </p>
                    </div>
                    <Switch
                      checked={formData.transaccionesNuevas}
                      onCheckedChange={(checked) => handleSwitchChange("transaccionesNuevas", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Objetivos Alcanzados</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificaciones cuando alcances un objetivo financiero
                      </p>
                    </div>
                    <Switch
                      checked={formData.objetivosAlcanzados}
                      onCheckedChange={(checked) => handleSwitchChange("objetivosAlcanzados", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recordatorios de Pago</Label>
                      <p className="text-sm text-muted-foreground">Recordatorios para pagos programados</p>
                    </div>
                    <Switch
                      checked={formData.recordatoriosPago}
                      onCheckedChange={(checked) => handleSwitchChange("recordatoriosPago", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={isLoading}>
                <Bell className="mr-2 h-4 w-4" />
                {isLoading ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="preferencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de la Aplicación</CardTitle>
              <CardDescription>Personaliza tu experiencia en la aplicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Apariencia</h3>
                <div className="grid gap-2">
                  <Label htmlFor="tema">Tema</Label>
                  <Select value={formData.tema} onValueChange={(value) => handleSelectChange("tema", value)}>
                    <SelectTrigger id="tema" className="flex items-center gap-2">
                      <SelectValue placeholder="Selecciona un tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span>Claro</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <span>Oscuro</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system" className="flex items-center gap-2">
                        <span>Sistema</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Moneda</h3>
                <div className="grid gap-2">
                  <Label htmlFor="moneda">Moneda Predeterminada</Label>
                  <Select value={formData.moneda} onValueChange={(value) => handleSelectChange("moneda", value)}>
                    <SelectTrigger id="moneda">
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                      <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Idioma</h3>
                <div className="grid gap-2">
                  <Label htmlFor="idioma">Idioma de la Aplicación</Label>
                  <Select value={formData.idioma} onValueChange={(value) => handleSelectChange("idioma", value)}>
                    <SelectTrigger id="idioma">
                      <SelectValue placeholder="Selecciona un idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Exportación de Datos</h3>
                <div className="grid gap-2">
                  <Label htmlFor="formatoExportacion">Formato de Exportación</Label>
                  <Select
                    value={formData.formatoExportacion}
                    onValueChange={(value) => handleSelectChange("formatoExportacion", value)}
                  >
                    <SelectTrigger id="formatoExportacion">
                      <SelectValue placeholder="Selecciona un formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline">Exportar Todos los Datos</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={isLoading}>
                <User className="mr-2 h-4 w-4" />
                {isLoading ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
