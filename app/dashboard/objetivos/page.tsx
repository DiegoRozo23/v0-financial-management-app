"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, Check, Edit, Plus, Target, Trash2, Download } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
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
import { exportAsCSV, exportAsExcel, exportAsPDF, formatDataForExport } from "@/utils/export-utils"
import { apiService, type Objetivo } from "@/services/api-service"

export default function ObjetivosPage() {
  const [openDialog, setOpenDialog] = useState<"nuevo" | "editar" | "ahorro" | null>(null)
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [objetivosCompletados, setObjetivosCompletados] = useState<Objetivo[]>([])
  const [objetivoActual, setObjetivoActual] = useState<Objetivo | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    actual: "",
    objetivo: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
  })
  const [montoAhorro, setMontoAhorro] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      setError(null)
      try {
        const data = await apiService.getObjetivos()

        // Separar objetivos completados y en progreso
        const completados = data.filter((obj) => obj.completado)
        const enProgreso = data.filter((obj) => !obj.completado)

        setObjetivos(enProgreso)
        setObjetivosCompletados(completados)
      } catch (err) {
        console.error("Error al cargar objetivos:", err)
        setError("Error al cargar los objetivos. Por favor, intenta de nuevo más tarde.")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id.split("-")[0]]: value }))
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      actual: "",
      objetivo: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: "",
    })
    setObjetivoActual(null)
    setMontoAhorro("")
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    // Validación básica
    if (!formData.nombre || !formData.objetivo || !formData.fechaInicio || !formData.fechaFin) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Asegurarse de que los valores numéricos sean números
      const objetivoNumerico = Number.parseFloat(formData.objetivo)
      const actualNumerico = formData.actual ? Number.parseFloat(formData.actual) : 0

      // Crear objeto con la estructura correcta según la API
      const objetivoData: Objetivo = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        actual: actualNumerico,
        objetivo: objetivoNumerico,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        completado: false,
      }

      if (objetivoActual) {
        // Actualizar objetivo existente
        const updatedObjetivo = await apiService.updateObjetivo(objetivoActual.id!, objetivoData)

        // Actualizar estado local
        setObjetivos((prev) => prev.map((obj) => (obj.id === objetivoActual.id ? updatedObjetivo : obj)))

        toast({
          title: "Objetivo actualizado",
          description: `Se ha actualizado "${formData.nombre}" correctamente.`,
        })
      } else {
        // Crear nuevo objetivo
        const newObjetivo = await apiService.createObjetivo(objetivoData)

        // Actualizar estado local
        setObjetivos((prev) => [...prev, newObjetivo])

        toast({
          title: "Objetivo creado",
          description: `Se ha creado "${formData.nombre}" correctamente.`,
        })
      }

      setOpenDialog(null)
      resetForm()
    } catch (err) {
      console.error("Error al guardar objetivo:", err)
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Ocurrió un error al guardar el objetivo. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (objetivo: Objetivo) => {
    setObjetivoActual(objetivo)
    setFormData({
      nombre: objetivo.nombre,
      descripcion: objetivo.descripcion,
      actual: objetivo.actual.toString(),
      objetivo: objetivo.objetivo.toString(),
      fechaInicio: objetivo.fechaInicio,
      fechaFin: objetivo.fechaFin,
    })
    setOpenDialog("editar")
  }

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteObjetivo(id)

      // Actualizar estado local
      setObjetivos(objetivos.filter((obj) => obj.id !== id))

      toast({
        title: "Objetivo eliminado",
        description: "El objetivo ha sido eliminado correctamente.",
      })
    } catch (err) {
      console.error("Error al eliminar objetivo:", err)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el objetivo. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const handleAgregarAhorro = async () => {
    setIsLoading(true)
    setError(null)

    // Validación básica
    if (!montoAhorro || Number.parseFloat(montoAhorro) <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (objetivoActual) {
        const monto = Number.parseFloat(montoAhorro)
        const nuevoActual = objetivoActual.actual + monto

        // Verificar si se completó el objetivo
        const completado = nuevoActual >= objetivoActual.objetivo

        // Actualizar objetivo
        const objetivoActualizado: Objetivo = {
          ...objetivoActual,
          actual: completado ? objetivoActual.objetivo : nuevoActual,
          completado,
        }

        const updatedObjetivo = await apiService.updateObjetivo(objetivoActual.id!, objetivoActualizado)

        if (completado) {
          // Mover a objetivos completados
          setObjetivosCompletados((prev) => [...prev, updatedObjetivo])
          setObjetivos((prev) => prev.filter((obj) => obj.id !== objetivoActual.id))

          toast({
            title: "¡Felicidades!",
            description: `Has completado tu objetivo "${objetivoActual.nombre}".`,
          })
        } else {
          // Actualizar en la lista de objetivos en progreso
          setObjetivos((prev) => prev.map((obj) => (obj.id === objetivoActual.id ? updatedObjetivo : obj)))

          toast({
            title: "Ahorro registrado",
            description: `Se ha agregado $${monto.toLocaleString()} a tu objetivo "${objetivoActual.nombre}".`,
          })
        }
      }

      setOpenDialog(null)
      resetForm()
    } catch (err) {
      console.error("Error al agregar ahorro:", err)
      toast({
        title: "Error",
        description: "Ocurrió un error al agregar el ahorro. Inténtalo de nuevo.",
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
    setExportLoading(true)

    setTimeout(() => {
      // Combine active and completed objectives for export
      const allObjetivos = [...objetivos, ...objetivosCompletados]
      const dataToExport = formatDataForExport(allObjetivos, "objetivos")
      const fileName = `objetivos_${new Date().toISOString().split("T")[0]}`

      switch (format) {
        case "excel":
          exportAsExcel(dataToExport, fileName)
          break
        case "pdf":
          exportAsPDF(dataToExport, fileName, "Reporte de Objetivos Financieros")
          break
        case "csv":
          exportAsCSV(dataToExport, fileName)
          break
      }

      setExportLoading(false)
      toast({
        title: "Exportación completada",
        description: `Tus objetivos han sido exportados en formato ${format.toUpperCase()}.`,
      })
      setShowExportOptions(false)
    }, 1000)
  }

  // Calcular porcentaje para cada objetivo
  const objetivosConPorcentaje = objetivos.map((obj) => ({
    ...obj,
    porcentaje: Math.round((obj.actual / obj.objetivo) * 100),
  }))

  // Datos para el gráfico de progreso
  const progresoData = objetivosConPorcentaje.map((obj) => ({
    name: obj.nombre,
    actual: obj.actual,
    objetivo: obj.objetivo,
    porcentaje: obj.porcentaje,
  }))

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando objetivos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Objetivos Financieros</h1>
          <p className="text-muted-foreground">Establece y haz seguimiento a tus metas financieras.</p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={openDialog === "nuevo"}
            onOpenChange={(open) => (open ? setOpenDialog("nuevo") : setOpenDialog(null))}
          >
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Objetivo</DialogTitle>
                <DialogDescription>Define una nueva meta financiera para ahorrar</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre-nuevo">Nombre</Label>
                  <Input
                    id="nombre-nuevo"
                    placeholder="Ej: Fondo de emergencia, Vacaciones, etc."
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion-nuevo">Descripción</Label>
                  <Textarea
                    id="descripcion-nuevo"
                    placeholder="Describe tu objetivo..."
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="objetivo-nuevo">Monto Objetivo</Label>
                  <Input
                    id="objetivo-nuevo"
                    type="number"
                    placeholder="0.00"
                    value={formData.objetivo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actual-nuevo">Monto Actual (opcional)</Label>
                  <Input
                    id="actual-nuevo"
                    type="number"
                    placeholder="0.00"
                    value={formData.actual}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fechaInicio-nuevo">Fecha Inicio</Label>
                    <Input
                      id="fechaInicio-nuevo"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fechaFin-nuevo">Fecha Fin</Label>
                    <Input id="fechaFin-nuevo" type="date" value={formData.fechaFin} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenDialog(null)
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
              <div className="absolute top-full right-0 mt-2 w-40 bg-background border rounded-md shadow-md z-10">
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
        </div>
      </div>

      {objetivosConPorcentaje.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Objetivos</CardTitle>
            <CardDescription>Visualización del avance hacia tus metas financieras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={progresoData}
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
                    formatter={(value: number, name: string) => {
                      if (name === "porcentaje") return [`${value}%`, "Progreso"]
                      return [`$${value.toLocaleString()}`, name === "actual" ? "Ahorrado" : "Meta"]
                    }}
                  />
                  <Legend />
                  <Bar dataKey="actual" name="Ahorrado" fill="#82ca9d" />
                  <Bar dataKey="objetivo" name="Meta" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {objetivosConPorcentaje.map((objetivo) => (
          <Card key={objetivo.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{objetivo.nombre}</CardTitle>
                  <CardDescription className="mt-1">{objetivo.descripcion}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(objetivo)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 dark:text-red-400">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el objetivo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleDelete(objetivo.id!)}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Progreso</div>
                  <div className="text-sm font-medium">{objetivo.porcentaje}%</div>
                </div>
                <Progress value={objetivo.porcentaje} className="h-2" />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Ahorrado</div>
                  <div className="text-sm font-medium">${objetivo.actual.toLocaleString()}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Meta</div>
                  <div className="text-sm font-medium">${objetivo.objetivo.toLocaleString()}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Falta</div>
                  <div className="text-sm font-medium">${(objetivo.objetivo - objetivo.actual).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(objetivo.fechaInicio)} - {formatDate(objetivo.fechaFin)}
                  </span>
                </div>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  setObjetivoActual(objetivo)
                  setOpenDialog("ahorro")
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ahorro
              </Button>
            </div>
          </Card>
        ))}
        <Card className="flex flex-col items-center justify-center p-6 border-dashed">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium mb-2">Crear nuevo objetivo</h3>
            <p className="text-sm text-muted-foreground mb-4">Establece una nueva meta financiera para ahorrar</p>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setOpenDialog("nuevo")}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Objetivo
            </Button>
          </div>
        </Card>
      </div>

      <Dialog
        open={openDialog === "ahorro"}
        onOpenChange={(open) => (open ? setOpenDialog("ahorro") : setOpenDialog(null))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Ahorro</DialogTitle>
            <DialogDescription>Agrega un nuevo ahorro a tu objetivo "{objetivoActual?.nombre}"</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="monto-ahorro">Monto</Label>
              <Input
                id="monto-ahorro"
                type="number"
                placeholder="0.00"
                value={montoAhorro}
                onChange={(e) => setMontoAhorro(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso actual:</span>
                <span>{objetivoActual ? Math.round((objetivoActual.actual / objetivoActual.objetivo) * 100) : 0}%</span>
              </div>
              <Progress
                value={objetivoActual ? Math.round((objetivoActual.actual / objetivoActual.objetivo) * 100) : 0}
                className="h-2"
              />
              <div className="flex justify-between text-sm">
                <span>Ahorrado: ${objetivoActual?.actual.toLocaleString()}</span>
                <span>Meta: ${objetivoActual?.objetivo.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenDialog(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleAgregarAhorro} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Agregar Ahorro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos Completados</CardTitle>
          <CardDescription>Metas financieras que has alcanzado</CardDescription>
        </CardHeader>
        <CardContent>
          {objetivosCompletados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aún no has completado ningún objetivo</div>
          ) : (
            <div className="space-y-4">
              {objetivosCompletados.map((objetivo) => (
                <div key={objetivo.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{objetivo.nombre}</h4>
                    <p className="text-xs text-muted-foreground">Completado el {formatDate(objetivo.fechaFin)}</p>
                  </div>
                  <div className="text-sm font-medium">${objetivo.objetivo.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
