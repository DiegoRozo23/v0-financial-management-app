"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, Edit, Plus, Target, Trash2, Download, Loader2 } from "lucide-react"
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
import { exportAsCSV, exportAsExcel, exportAsPDF, formatDataForExport } from "@/utils/export-utils"
import { apiService, type Objetivo, type Frecuencia } from "@/services/api-service"

// Tipo extendido para manejar objetivos con datos adicionales de progreso
interface ObjetivoExtendido extends Objetivo {
  porcentaje: number
  actual: number
  completado?: boolean
  fechaCompletado?: string
}

export default function ObjetivosPage() {
  const [openDialog, setOpenDialog] = useState<"nuevo" | "editar" | "ahorro" | null>(null)
  const [objetivos, setObjetivos] = useState<ObjetivoExtendido[]>([])
  const [objetivosCompletados, setObjetivosCompletados] = useState<ObjetivoExtendido[]>([])
  const [objetivoActual, setObjetivoActual] = useState<ObjetivoExtendido | null>(null)
  const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    actual: "",
    meta: "",
    frecuencia: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
  })
  const [montoAhorro, setMontoAhorro] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true)
      setError(null)

      try {
        // Obtener objetivos y frecuencias en paralelo
        const [objetivosData, frecuenciasData] = await Promise.all([
          apiService.getObjetivos(),
          apiService.getFrecuencias(),
        ])

        // Transformar objetivos para incluir campos adicionales de progreso
        // Nota: El API no proporciona estos campos, así que se agregan con valores por defecto
        const objetivosExtendidos = objetivosData.map((objetivo) => ({
          ...objetivo,
          actual: 0, // Valor simulado, en un caso real se calcularía basado en transacciones relacionadas
          porcentaje: 0, // Se calcularía como (actual / meta) * 100
          completado: false,
        }))

        // Separar en activos y completados (en este caso todos son activos)
        setObjetivos(objetivosExtendidos.filter((obj) => !obj.completado))
        setObjetivosCompletados(objetivosExtendidos.filter((obj) => obj.completado))
        setFrecuencias(frecuenciasData)
      } catch (err) {
        console.error("Error al cargar objetivos:", err)
        setError("No se pudieron cargar los objetivos. Intente nuevamente más tarde.")
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id.split("-")[0]]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, frecuencia: value }))
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      actual: "",
      meta: "",
      frecuencia: "",
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
    if (!formData.nombre || !formData.meta || !formData.fechaInicio || !formData.frecuencia) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Obtener el objeto de frecuencia seleccionado
      const frecuenciaSeleccionada = frecuencias.find((f) => f.id.toString() === formData.frecuencia)

      if (!frecuenciaSeleccionada) {
        throw new Error("Frecuencia no válida")
      }

      const dataToSave = {
        nombre: formData.nombre,
        meta: Number.parseFloat(formData.meta),
        frecuencia: frecuenciaSeleccionada,
      }

      if (objetivoActual) {
        // Actualizar objetivo existente
        const updatedObjetivo = await apiService.updateObjetivo(objetivoActual.id || 0, dataToSave)

        // Actualizar estado local
        const updatedObjetivos = objetivos.map((obj) =>
          obj.id === objetivoActual.id
            ? {
                ...updatedObjetivo,
                actual: obj.actual, // Mantener el valor actual
                porcentaje: Math.round((obj.actual / updatedObjetivo.meta) * 100),
              }
            : obj,
        )

        setObjetivos(updatedObjetivos)

        toast({
          title: "Objetivo actualizado",
          description: `Se ha actualizado "${formData.nombre}" correctamente.`,
        })
      } else {
        // Crear nuevo objetivo
        const newObjetivo = await apiService.createObjetivo(dataToSave)

        // Agregar al estado local con campos adicionales
        const objetivoExtendido: ObjetivoExtendido = {
          ...newObjetivo,
          actual: formData.actual ? Number.parseFloat(formData.actual) : 0,
          porcentaje: formData.actual
            ? Math.round((Number.parseFloat(formData.actual) / Number.parseFloat(formData.meta)) * 100)
            : 0,
        }

        setObjetivos([...objetivos, objetivoExtendido])

        toast({
          title: "Objetivo creado",
          description: `Se ha creado "${formData.nombre}" correctamente.`,
        })
      }
    } catch (err) {
      console.error("Error al guardar objetivo:", err)
      toast({
        title: "Error",
        description: "No se pudo guardar el objetivo. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setOpenDialog(null)
      resetForm()
    }
  }

  const handleEdit = (objetivo: ObjetivoExtendido) => {
    setObjetivoActual(objetivo)
    setFormData({
      nombre: objetivo.nombre,
      descripcion: "",
      actual: objetivo.actual.toString(),
      meta: objetivo.meta.toString(),
      frecuencia: objetivo.frecuencia.id.toString(),
      fechaInicio: new Date().toISOString().split("T")[0], // Usar fecha actual como valor por defecto
      fechaFin: "",
    })
    setOpenDialog("editar")
  }

  const handleDelete = async (id: number) => {
    setIsLoading(true)
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
        description: "No se pudo eliminar el objetivo. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgregarAhorro = () => {
    setIsLoading(true)

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

    // Nota: Esta función es simulada ya que el API no tiene endpoint para actualizar el progreso
    // En una implementación real, se haría una llamada a la API
    setTimeout(() => {
      if (objetivoActual) {
        const monto = Number.parseFloat(montoAhorro)
        const nuevoActual = objetivoActual.actual + monto
        const nuevoPorcentaje = Math.min(100, Math.round((nuevoActual / objetivoActual.meta) * 100))

        // Verificar si se completó el objetivo
        if (nuevoActual >= objetivoActual.meta) {
          // Mover a objetivos completados
          const fechaActual = new Date().toISOString().split("T")[0]
          const objetivoCompletado = {
            ...objetivoActual,
            actual: objetivoActual.meta,
            porcentaje: 100,
            completado: true,
            fechaCompletado: fechaActual,
          }

          setObjetivosCompletados([...objetivosCompletados, objetivoCompletado])
          setObjetivos(objetivos.filter((obj) => obj.id !== objetivoActual.id))

          toast({
            title: "¡Felicidades!",
            description: `Has completado tu objetivo "${objetivoActual.nombre}".`,
          })
        } else {
          // Actualizar objetivo
          const updatedObjetivos = objetivos.map((obj) =>
            obj.id === objetivoActual.id
              ? {
                  ...obj,
                  actual: nuevoActual,
                  porcentaje: nuevoPorcentaje,
                }
              : obj,
          )
          setObjetivos(updatedObjetivos)

          toast({
            title: "Ahorro registrado",
            description: `Se ha agregado $${monto.toLocaleString()} a tu objetivo "${objetivoActual.nombre}".`,
          })
        }
      }

      setIsLoading(false)
      setOpenDialog(null)
      resetForm()
    }, 600)
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

  // Datos para el gráfico de progreso
  const progresoData = objetivos.map((obj) => ({
    name: obj.nombre,
    actual: obj.actual,
    objetivo: obj.meta,
    porcentaje: obj.porcentaje,
  }))

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Objetivos Financieros</h1>
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
                  <Label htmlFor="meta-nuevo">Monto Objetivo</Label>
                  <Input
                    id="meta-nuevo"
                    type="number"
                    placeholder="0.00"
                    value={formData.meta}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frecuencia-nuevo">Frecuencia</Label>
                  <Select value={formData.frecuencia} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {frecuencias.map((frecuencia) => (
                        <SelectItem key={frecuencia.id} value={frecuencia.id.toString()}>
                          {frecuencia.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div className="grid gap-2">
                  <Label htmlFor="fechaInicio-nuevo">Fecha Inicio</Label>
                  <Input id="fechaInicio-nuevo" type="date" value={formData.fechaInicio} onChange={handleInputChange} />
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

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {objetivos.length > 0 && !error && (
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
        {objetivos.length === 0 && !error ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground py-12">
                <Target className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">No tienes objetivos financieros registrados</p>
                <p className="mb-4">Crea tu primer objetivo para comenzar a ahorrar</p>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setOpenDialog("nuevo")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Objetivo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          objetivos.map((objetivo) => (
            <Card key={objetivo.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{objetivo.nombre}</CardTitle>
                    <CardDescription className="mt-1">Frecuencia: {objetivo.frecuencia.nombre}</CardDescription>
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
                            onClick={() => handleDelete(objetivo.id || 0)}
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
                    <div className="text-sm font-medium">${objetivo.meta.toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">Falta</div>
                    <div className="text-sm font-medium">${(objetivo.meta - objetivo.actual).toLocaleString()}</div>
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
          ))
        )}
        {objetivos.length > 0 && !error && (
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
        )}
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
                <span>{objetivoActual?.porcentaje}%</span>
              </div>
              <Progress value={objetivoActual?.porcentaje} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>Ahorrado: ${objetivoActual?.actual.toLocaleString()}</span>
                <span>Meta: ${objetivoActual?.meta.toLocaleString()}</span>
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
                    <p className="text-xs text-muted-foreground">
                      Completado el {objetivo.fechaCompletado ? formatDate(objetivo.fechaCompletado) : "N/A"}
                    </p>
                  </div>
                  <div className="text-sm font-medium">${objetivo.meta.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
