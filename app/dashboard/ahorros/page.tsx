"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, LineChart, Plus, TrendingUp, Edit, Trash2, Download, PiggyBank, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/ui/chart"
import { exportAsCSV, exportAsExcel, exportAsPDF } from "@/utils/export-utils"
import { apiService, type Ahorro } from "@/services/api-service"

export default function AhorrosPage() {
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState("todos")
  const [ahorros, setAhorros] = useState<Ahorro[]>([])
  const [ahorroActual, setAhorroActual] = useState<Ahorro | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    monto: "",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    fecha_Final: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf" | "csv">("excel")
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchAhorros = async () => {
      setIsFetching(true)
      setError(null)

      try {
        const ahorrosData = await apiService.getAhorros()
        setAhorros(ahorrosData)
      } catch (err) {
        console.error("Error al cargar ahorros:", err)
        setError("No se pudieron cargar los ahorros. Intente nuevamente más tarde.")
      } finally {
        setIsFetching(false)
      }
    }

    fetchAhorros()
  }, [])

  const tiposAhorro = ["Emergencia", "Ocio", "Compras grandes", "Educación", "Hogar", "Jubilación", "Otros"]

  const totalAhorros = ahorros.reduce((sum, ahorro) => sum + ahorro.monto, 0)

  // Calculamos el ahorro mensual basado en los ahorros del último mes
  const hoy = new Date()
  const unMesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate()).toISOString().split("T")[0]
  const ahorroMensual = ahorros
    .filter((ahorro) => new Date(ahorro.fecha) >= new Date(unMesAtras))
    .reduce((sum, ahorro) => sum + ahorro.monto, 0)

  const filteredAhorros = ahorros.filter((ahorro) => {
    if (activeTab === "todos") return true

    // Filtramos por descripción, ya que el API no tiene un campo de tipo
    return ahorro.descripcion.toLowerCase().includes(activeTab.toLowerCase())
  })

  // Datos para gráficos
  const distribucionData = tiposAhorro
    .map((tipo) => {
      const montoTotal = ahorros
        .filter((ahorro) => ahorro.descripcion.toLowerCase().includes(tipo.toLowerCase()))
        .reduce((sum, ahorro) => sum + ahorro.monto, 0)

      return {
        name: tipo,
        value: montoTotal,
      }
    })
    .filter((item) => item.value > 0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    const fieldName = id.split("-")[0]
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSelectChange = (value: string) => {
    // Como el API no tiene un campo tipo, lo guardamos en descripción
    setFormData((prev) => ({ ...prev, descripcion: `${value}: ${prev.descripcion}` }))
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      monto: "",
      descripcion: "",
      fecha: new Date().toISOString().split("T")[0],
      fecha_Final: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    })
    setAhorroActual(null)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    // Validación básica
    if (!formData.nombre || !formData.monto || !formData.fecha) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const ahorroData = {
        nombre: formData.nombre,
        monto: Number.parseFloat(formData.monto),
        descripcion: formData.descripcion || "Ahorro",
        fecha: formData.fecha,
        fecha_Final:
          formData.fecha_Final ||
          new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      }

      if (ahorroActual) {
        // Actualizar ahorro existente
        const updatedAhorro = await apiService.updateAhorro(ahorroActual.id || 0, ahorroData)

        // Actualizar estado local
        const updatedAhorros = ahorros.map((ahorro) => (ahorro.id === ahorroActual.id ? updatedAhorro : ahorro))

        setAhorros(updatedAhorros)

        toast({
          title: "Ahorro actualizado",
          description: `Se ha actualizado "${formData.nombre}" correctamente.`,
        })
      } else {
        // Crear nuevo ahorro
        const newAhorro = await apiService.createAhorro(ahorroData)
        setAhorros([...ahorros, newAhorro])

        toast({
          title: "Ahorro creado",
          description: `Se ha registrado "${formData.nombre}" correctamente.`,
        })
      }
    } catch (err) {
      console.error("Error al guardar ahorro:", err)
      toast({
        title: "Error",
        description: "No se pudo guardar el ahorro. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setOpenDialog(false)
      resetForm()
    }
  }

  const handleEdit = (ahorro: Ahorro) => {
    setAhorroActual(ahorro)
    setFormData({
      nombre: ahorro.nombre,
      monto: ahorro.monto.toString(),
      descripcion: ahorro.descripcion,
      fecha: ahorro.fecha,
      fecha_Final: ahorro.fecha_Final,
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    setIsLoading(true)
    try {
      await apiService.deleteAhorro(id)

      // Actualizar estado local
      setAhorros(ahorros.filter((ahorro) => ahorro.id !== id))

      toast({
        title: "Ahorro eliminado",
        description: "El ahorro ha sido eliminado correctamente.",
      })
    } catch (err) {
      console.error("Error al eliminar ahorro:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar el ahorro. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    setExportFormat(format)
    setExportLoading(true)

    setTimeout(() => {
      const dataToExport = filteredAhorros.map((ahorro) => ({
        Nombre: ahorro.nombre,
        Tipo: "Ahorro",
        "Fecha Inicio": formatDate(ahorro.fecha),
        "Fecha Fin": formatDate(ahorro.fecha_Final),
        Monto: `$${ahorro.monto.toLocaleString()}`,
        Descripción: ahorro.descripcion || "",
      }))

      const fileName = `ahorros_${new Date().toISOString().split("T")[0]}`

      switch (format) {
        case "excel":
          exportAsExcel(dataToExport, fileName)
          break
        case "pdf":
          exportAsPDF(dataToExport, fileName, "Reporte de Ahorros")
          break
        case "csv":
          exportAsCSV(dataToExport, fileName)
          break
      }

      setExportLoading(false)
      toast({
        title: "Exportación completada",
        description: `Tus ahorros han sido exportados en formato ${format.toUpperCase()}.`,
      })
      setShowExportOptions(false)
    }, 1000)
  }

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ahorros</h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ahorros</h1>
          <p className="text-muted-foreground">Administra y haz seguimiento de tus ahorros.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ahorro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ahorroActual ? "Editar Ahorro" : "Registrar Nuevo Ahorro"}</DialogTitle>
                <DialogDescription>
                  {ahorroActual ? "Modifica los detalles de tu ahorro" : "Ingresa los detalles de tu nuevo ahorro"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre-ahorro">Nombre</Label>
                  <Input
                    id="nombre-ahorro"
                    placeholder="Ej: Fondo de emergencia, Vacaciones, etc."
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo-ahorro">Tipo</Label>
                  <Select onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposAhorro.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monto-ahorro">Monto</Label>
                  <Input
                    id="monto-ahorro"
                    type="number"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion-ahorro">Descripción (opcional)</Label>
                  <Input
                    id="descripcion-ahorro"
                    placeholder="Describe el propósito de este ahorro"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha-ahorro">Fecha de Inicio</Label>
                  <Input id="fecha-ahorro" type="date" value={formData.fecha} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha_Final-ahorro">Fecha Final</Label>
                  <Input
                    id="fecha_Final-ahorro"
                    type="date"
                    value={formData.fecha_Final}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ahorros</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAhorros.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{ahorros.length} ahorros registrados</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ahorro Mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${ahorroMensual.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {ahorroMensual > 0 ? "Buen trabajo ahorrando este mes" : "No has ahorrado este mes"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mayor Ahorro</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ahorros.length > 0
                ? ahorros.reduce((max, ahorro) => (ahorro.monto > max.monto ? ahorro : max), ahorros[0]).nombre
                : "N/A"}
            </div>
            <div className="text-xs text-green-600">
              {ahorros.length > 0
                ? `$${ahorros
                    .reduce((max, ahorro) => (ahorro.monto > max.monto ? ahorro : max), ahorros[0])
                    .monto.toLocaleString()}`
                : "Sin datos"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fondos</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ahorros.length}</div>
            <div className="text-xs text-muted-foreground">Planificando tu futuro financiero</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {!error && ahorros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ahorros</CardTitle>
            <CardDescription>Visualiza el crecimiento de tus ahorros en el tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ahorros.map((ahorro) => ({
                    name: ahorro.nombre,
                    monto: ahorro.monto,
                  }))}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Monto"]}
                    labelFormatter={(label) => `Ahorro: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="monto" name="Monto Ahorrado" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="emergencia">Emergencia</TabsTrigger>
          <TabsTrigger value="ocio">Ocio</TabsTrigger>
          <TabsTrigger value="otros">Otros</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mis Ahorros</CardTitle>
              <CardDescription>
                Listado de {activeTab === "todos" ? "todos tus ahorros" : `tus ahorros de tipo ${activeTab}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Cargando ahorros...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Final</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAhorros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron ahorros
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAhorros.map((ahorro) => (
                        <TableRow key={ahorro.id}>
                          <TableCell className="font-medium">{ahorro.nombre}</TableCell>
                          <TableCell>{formatDate(ahorro.fecha)}</TableCell>
                          <TableCell>{formatDate(ahorro.fecha_Final)}</TableCell>
                          <TableCell>${ahorro.monto.toLocaleString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ahorro.descripcion || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(ahorro)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600 dark:text-red-400">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Eliminar</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente el ahorro.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDelete(ahorro.id || 0)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                {showExportOptions && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-background border rounded-md shadow-md z-10">
                    <div className="p-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => handleExport("excel")}
                        disabled={exportLoading}
                      >
                        Excel
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => handleExport("pdf")}
                        disabled={exportLoading}
                      >
                        PDF
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => handleExport("csv")}
                        disabled={exportLoading}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>

          {filteredAhorros.length > 0 && !error && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ahorros</CardTitle>
                <CardDescription>Distribución de tus ahorros por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={distribucionData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Monto"]} />
                      <Legend />
                      <Bar dataKey="value" name="Monto" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
