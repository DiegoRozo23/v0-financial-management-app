"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CreditCard,
  Filter,
  Plus,
  Search,
  Trash2,
  Edit,
  Download,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { apiService, type Ingreso, type Gasto, type GastoFijo, type Frecuencia } from "@/services/api-service"

// Interfaz unificada para mostrar transacciones
interface Transaccion {
  id: string
  tipo: "ingreso" | "gasto"
  descripcion: string
  cantidad: number
  fecha: string
  originalId: number | undefined
  esGastoFijo: boolean | null
  frecuencia?: number
}

export default function IngresosGastosPage() {
  const searchParams = useSearchParams()
  const nuevoParam = searchParams.get("nuevo")

  const [activeTab, setActiveTab] = useState("todos")
  const [openDialog, setOpenDialog] = useState<"ingreso" | "gasto" | "editar" | null>(
    nuevoParam === "ingreso" ? "ingreso" : nuevoParam === "gasto" ? "gasto" : null,
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [transaccionActual, setTransaccionActual] = useState<Transaccion | null>(null)
  const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([])
  const [fechaInicio, setFechaInicio] = useState<string>("")
  const [fechaFin, setFechaFin] = useState<string>("")
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>("personalizado")
  interface FormData {
    descripcion: string
    cantidad: string
    fecha: string
    esGastoFijo: boolean | null
    frecuencia: string
  }
  const [formData, setFormData] = useState<FormData>({
    descripcion: "",
    cantidad: "",
    fecha: new Date().toISOString().split("T")[0],
    esGastoFijo: null,
    frecuencia: ""
  })
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
        // Obtener datos de ingresos, gastos y gastos fijos en paralelo
        const [ingresosData, gastosData, gastosFijosData] = await Promise.all([
          apiService.getIngresos(), 
          apiService.getGastos(),
          apiService.getGastosFijos()
        ])

        console.log("Datos iniciales de ingresos:", ingresosData)
        console.log("Datos iniciales de gastos:", gastosData)
        console.log("Datos iniciales de gastos fijos:", gastosFijosData)

        // Transformar a formato unificado
        const ingresosFormateados: Transaccion[] = ingresosData.map((ingreso) => ({
          id: `ingreso-${ingreso.id}`,
          tipo: "ingreso",
          descripcion: ingreso.descripcion || '',
          cantidad: ingreso.cantidad,
          fecha: ingreso.fecha,
          originalId: ingreso.id,
          esGastoFijo: false,
        }))

        const gastosFormateados: Transaccion[] = gastosData.map((gasto) => ({
          id: `gasto-${gasto.id}`,
          tipo: "gasto",
          descripcion: gasto.descripcion,
          cantidad: gasto.cantidad,
          fecha: gasto.fecha,
          originalId: gasto.id,
          esGastoFijo: false,
        }))

        const gastosFijosFormateados: Transaccion[] = gastosFijosData.map((gastoFijo) => ({
          id: `gasto-fijo-${gastoFijo.id}`,
          tipo: "gasto",
          descripcion: gastoFijo.descripcion,
          cantidad: gastoFijo.cantidad,
          fecha: gastoFijo.fecha,
          originalId: gastoFijo.id,
          esGastoFijo: true,
          frecuencia: gastoFijo.frecuencia
        }))

        // Combinar y ordenar por fecha (más reciente primero)
        const todasTransacciones = [...ingresosFormateados, ...gastosFormateados, ...gastosFijosFormateados].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        )

        console.log("Transacciones iniciales combinadas:", todasTransacciones)

        setTransacciones(todasTransacciones)
      } catch (err) {
        console.error("Error al cargar ingresos y gastos:", err)
        setError("No se pudieron cargar los datos. Intente nuevamente más tarde.")
      } finally {
        setIsFetching(false)
      }
    }

    fetchData()
  }, [])

  // Cargar frecuencias al montar el componente
  useEffect(() => {
    const fetchFrecuencias = async () => {
      try {
        const data = await apiService.getFrecuencias()
        setFrecuencias(data)
      } catch (err) {
        console.error("Error al cargar frecuencias:", err)
        toast({
          title: "Error",
          description: "No se pudieron cargar las frecuencias.",
          variant: "destructive",
        })
      }
    }

    fetchFrecuencias()
  }, [])

  const handleFilter = async () => {
    setIsFetching(true)
    setError(null)

    try {
      // Obtener todos los datos filtrados por fecha
      const [ingresosData, gastosData] = await Promise.all([
        apiService.getIngresosPorRango({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        }),
        apiService.getGastosPorRango({
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        })
      ])

      console.log("Datos de ingresos recibidos:", ingresosData)
      console.log("Datos de gastos recibidos:", gastosData)

      // Obtener gastos fijos (sin filtro de fecha)
      const gastosFijosData = await apiService.getGastosFijos()
      console.log("Datos de gastos fijos recibidos:", gastosFijosData)

      // Transformar a formato unificado
      const ingresosFormateados: Transaccion[] = ingresosData.map((ingreso) => ({
        id: `ingreso-${ingreso.id}`,
        tipo: "ingreso",
        descripcion: ingreso.descripcion || '',
        cantidad: ingreso.cantidad,
        fecha: ingreso.fecha,
        originalId: ingreso.id,
        esGastoFijo: false,
      }))

      const gastosFormateados: Transaccion[] = gastosData.map((gasto) => ({
        id: `gasto-${gasto.id}`,
        tipo: "gasto",
        descripcion: gasto.descripcion,
        cantidad: gasto.cantidad,
        fecha: gasto.fecha,
        originalId: gasto.id,
        esGastoFijo: false,
        frecuencia: undefined
      }))

      const gastosFijosFormateados: Transaccion[] = gastosFijosData.map((gastoFijo) => ({
        id: `gasto-fijo-${gastoFijo.id}`,
        tipo: "gasto",
        descripcion: gastoFijo.descripcion,
        cantidad: gastoFijo.cantidad,
        fecha: gastoFijo.fecha,
        originalId: gastoFijo.id,
        esGastoFijo: true,
        frecuencia: gastoFijo.frecuencia
      }))

      // Combinar todos los datos y ordenar por fecha
      const todasTransacciones = [...ingresosFormateados, ...gastosFormateados, ...gastosFijosFormateados].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )

      console.log("Transacciones combinadas:", todasTransacciones)

      setTransacciones(todasTransacciones)
      setIsFilterDialogOpen(false)
    } catch (err) {
      console.error("Error al filtrar transacciones:", err)
      setError("No se pudieron filtrar las transacciones. Intente nuevamente.")
    } finally {
      setIsFetching(false)
    }
  }

  // Filtrar transacciones según el tab activo y búsqueda
  const filteredTransacciones = transacciones
    .filter((t) => {
      if (activeTab === "todos") return true;
      if (activeTab === "ingreso") return t.tipo === "ingreso";
      if (activeTab === "gasto") return t.tipo === "gasto" && !t.esGastoFijo;
      if (activeTab === "gasto-fijo") return t.tipo === "gasto" && t.esGastoFijo;
      return true;
    })
    .filter(
      (t) =>
        searchTerm === "" ||
        (t.descripcion && t.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
    )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    const fieldName = id.split("-")[0] // 'descripcion', 'cantidad', 'fecha', 'frecuencia'
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const resetForm = () => {
    setFormData({
      descripcion: "",
      cantidad: "",
      fecha: new Date().toISOString().split("T")[0],
      esGastoFijo: null,
      frecuencia: ""
    })
    setTransaccionActual(null)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    if (!formData.cantidad || (formData.esGastoFijo === false && !formData.fecha)) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if ((openDialog === "gasto" || transaccionActual) && !formData.descripcion) {
      toast({
        title: "Error",
        description: "Por favor completa la descripción.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Validar frecuencia solo para gastos fijos
    if (formData.esGastoFijo && !formData.frecuencia) {
      toast({
        title: "Error",
        description: "Por favor selecciona una frecuencia para el gasto fijo.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      if (transaccionActual) {
        // Actualizar transacción existente
        const commonUpdateData = {
          descripcion: formData.descripcion.trim(),
          cantidad: Number.parseFloat(formData.cantidad),
          ...(formData.esGastoFijo ? { frecuencia: Number(formData.frecuencia) } : { fecha: formData.fecha }),
        }

        if (transaccionActual.tipo === "ingreso") {
          await apiService.updateIngreso(transaccionActual.originalId || 0, commonUpdateData as Ingreso)
        } else {
          if (formData.esGastoFijo) {
            await apiService.updateGastoFijo(transaccionActual.originalId || 0, {
              ...commonUpdateData,
              frecuencia: Number(formData.frecuencia)
            } as GastoFijo)
          } else {
            await apiService.updateGasto(transaccionActual.originalId || 0, commonUpdateData as Gasto)
          }
        }

        const updatedTransacciones = transacciones.map((t) =>
          t.id === transaccionActual.id
            ? {
                ...t,
                descripcion: formData.descripcion.trim(),
                cantidad: Number.parseFloat(formData.cantidad),
                fecha: formData.fecha,
                esGastoFijo: formData.esGastoFijo,
                frecuencia: formData.esGastoFijo ? Number(formData.frecuencia) : undefined
              }
            : t,
        )
        setTransacciones(updatedTransacciones)

        toast({
          title: "Transacción actualizada",
          description: `Se ha actualizado correctamente.`,
        })
      } else {
        let newTransaccion: Transaccion
        let createdItem

        const commonCreateData = {
          descripcion: formData.descripcion.trim(),
          cantidad: Number.parseFloat(formData.cantidad),
          fecha: formData.fecha,
        }

        if (openDialog === "ingreso") {
          createdItem = await apiService.createIngreso(commonCreateData as Ingreso)
          newTransaccion = {
            id: `ingreso-${createdItem.id}`,
            tipo: "ingreso",
            descripcion: createdItem.descripcion || formData.descripcion.trim(),
            cantidad: createdItem.cantidad,
            fecha: createdItem.fecha,
            originalId: createdItem.id,
            esGastoFijo: false
          }
        } else {
          if (formData.esGastoFijo) {
            const gastoFijoData = {
              ...commonCreateData,
              frecuencia: Number(formData.frecuencia)
            }
            createdItem = await apiService.createGastoFijo(gastoFijoData as GastoFijo)
            newTransaccion = {
              id: `gasto-fijo-${createdItem.id}`,
              tipo: "gasto",
              descripcion: createdItem.descripcion,
              cantidad: createdItem.cantidad,
              fecha: createdItem.fecha,
              originalId: createdItem.id,
              esGastoFijo: true,
              frecuencia: Number(formData.frecuencia)
            }
          } else {
            const gastoData = {
              ...commonCreateData,
              frecuencia: Number(formData.frecuencia)
            }
            createdItem = await apiService.createGasto(gastoData as Gasto)
            newTransaccion = {
              id: `gasto-${createdItem.id}`,
              tipo: "gasto",
              descripcion: createdItem.descripcion,
              cantidad: createdItem.cantidad,
              fecha: createdItem.fecha,
              originalId: createdItem.id,
              esGastoFijo: false,
              frecuencia: Number(formData.frecuencia)
            }
          }
        }

        const updatedTransacciones = [newTransaccion, ...transacciones].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        )
        setTransacciones(updatedTransacciones)

        toast({
          title: "Transacción creada",
          description: `Se ha registrado correctamente.`,
        })
      }
    } catch (err) {
      console.error("Error al guardar la transacción:", err)
      toast({
        title: "Error",
        description: "No se pudo guardar la transacción. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setOpenDialog(null)
      resetForm()
    }
  }

  const handleEdit = (transaccion: Transaccion) => {
    setTransaccionActual(transaccion)
    setFormData({
      descripcion: transaccion.descripcion,
      cantidad: transaccion.cantidad.toString(),
      fecha: transaccion.fecha,
      esGastoFijo: transaccion.esGastoFijo,
      frecuencia: transaccion.frecuencia?.toString() || ""
    })
    setOpenDialog("editar")
  }

  const handleDelete = async (transaccion: Transaccion) => {
    setIsLoading(true)
    try {
      if (transaccion.originalId === undefined) {
        throw new Error("Transaction ID is undefined, cannot delete.");
      }
      if (transaccion.tipo === "ingreso") {
        await apiService.deleteIngreso(transaccion.originalId)
      } else if (transaccion.esGastoFijo) {
        await apiService.deleteGastoFijo(transaccion.originalId)
      } else {
        await apiService.deleteGasto(transaccion.originalId)
      }

      // Actualizar estado local
      setTransacciones(transacciones.filter((t) => t.id !== transaccion.id))

      toast({
        title: "Transacción eliminada",
        description: "La transacción ha sido eliminada correctamente.",
      })
    } catch (err) {
      console.error("Error al eliminar la transacción:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción. Intente nuevamente.",
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

  const getFrecuenciaText = (frecuenciaId: number | undefined) => {
    if (!frecuenciaId) return "";
    const frecuencia = frecuencias.find(f => f.id === frecuenciaId);
    return frecuencia ? frecuencia.Tipo : "";
  }

  // Calcular totales
  const totalIngresos = transacciones.filter((t) => t.tipo === "ingreso").reduce((sum, t) => sum + t.cantidad, 0)
  const totalGastos = transacciones.filter((t) => t.tipo === "gasto").reduce((sum, t) => sum + t.cantidad, 0)

  const balance = totalIngresos - totalGastos

  const getPeriodoFechas = (periodo: string) => {
    const hoy = new Date()
    const inicio = new Date()
    
    switch (periodo) {
      case "semana":
        inicio.setDate(hoy.getDate() - 7)
        break
      case "mes":
        inicio.setMonth(hoy.getMonth() - 1)
        break
      case "año":
        inicio.setFullYear(hoy.getFullYear() - 1)
        break
      default:
        return { inicio: "", fin: "" }
    }

    return {
      inicio: inicio.toISOString().split('T')[0],
      fin: hoy.toISOString().split('T')[0]
    }
  }

  const handlePeriodoChange = (periodo: string) => {
    setPeriodoSeleccionado(periodo)
    if (periodo !== "personalizado") {
      const fechas = getPeriodoFechas(periodo)
      setFechaInicio(fechas.inicio)
      setFechaFin(fechas.fin)
    }
  }

  const handleLimpiarFiltros = async () => {
    setIsFetching(true)
    setError(null)
    setFechaInicio("")
    setFechaFin("")
    setPeriodoSeleccionado("personalizado")

    try {
      // Obtener datos según el tab activo
      if (activeTab === "gasto-fijo") {
        const gastosFijosData = await apiService.getGastosFijos()
        const gastosFijosFormateados: Transaccion[] = gastosFijosData.map((gastoFijo) => ({
          id: `gasto-fijo-${gastoFijo.id}`,
          tipo: "gasto",
          descripcion: gastoFijo.descripcion,
          cantidad: gastoFijo.cantidad,
          fecha: gastoFijo.fecha,
          originalId: gastoFijo.id,
          esGastoFijo: true,
          frecuencia: gastoFijo.frecuencia
        }))
        setTransacciones(gastosFijosFormateados)
      } else {
        // Para otros tabs, cargar todos los datos
        const [ingresosData, gastosData, gastosFijosData] = await Promise.all([
          apiService.getIngresos(), 
          apiService.getGastos(),
          apiService.getGastosFijos()
        ])

        const ingresosFormateados: Transaccion[] = ingresosData.map((ingreso) => ({
          id: `ingreso-${ingreso.id}`,
          tipo: "ingreso",
          descripcion: ingreso.descripcion || '',
          cantidad: ingreso.cantidad,
          fecha: ingreso.fecha,
          originalId: ingreso.id,
          esGastoFijo: false,
        }))

        const gastosFormateados: Transaccion[] = gastosData.map((gasto) => ({
          id: `gasto-${gasto.id}`,
          tipo: "gasto",
          descripcion: gasto.descripcion,
          cantidad: gasto.cantidad,
          fecha: gasto.fecha,
          originalId: gasto.id,
          esGastoFijo: false,
        }))

        const gastosFijosFormateados: Transaccion[] = gastosFijosData.map((gastoFijo) => ({
          id: `gasto-fijo-${gastoFijo.id}`,
          tipo: "gasto",
          descripcion: gastoFijo.descripcion,
          cantidad: gastoFijo.cantidad,
          fecha: gastoFijo.fecha,
          originalId: gastoFijo.id,
          esGastoFijo: true,
          frecuencia: gastoFijo.frecuencia
        }))

        // Combinar y ordenar por fecha (más reciente primero)
        const todasTransacciones = [...ingresosFormateados, ...gastosFormateados, ...gastosFijosFormateados].sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        )

        setTransacciones(todasTransacciones)
      }
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("No se pudieron cargar los datos. Intente nuevamente.")
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ingresos y Gastos</h1>
          <p className="text-muted-foreground">Administra tus transacciones financieras.</p>
        </div>
        <div className="flex gap-2">
          {/* Dialog for New Ingreso */}
          <Dialog
            open={openDialog === "ingreso"}
            onOpenChange={(open) => (open ? setOpenDialog("ingreso") : setOpenDialog(null))}
          >
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ingreso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Ingreso</DialogTitle>
                <DialogDescription>Ingresa los detalles de tu nuevo ingreso</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                   {/* Descripción para Ingreso (Opcional en frontend, el backend la ignorará si no se actualiza el serializer) */}
                   <Label htmlFor="descripcion-ingreso">Descripción (Opcional)</Label>
                   <Input
                     id="descripcion-ingreso"
                     placeholder="Ej: Salario, Freelance, etc."
                     value={formData.descripcion}
                     onChange={handleInputChange}
                   />
                 </div>
                <div className="grid gap-2">
                  <Label htmlFor="cantidad-ingreso">Cantidad</Label>
                  <Input
                    id="cantidad-ingreso"
                    type="number"
                    placeholder="0.00"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha-ingreso">Fecha</Label>
                  <div className="relative">
                    <Input id="fecha-ingreso" type="date" value={formData.fecha} onChange={handleInputChange} />
                    <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
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

          {/* Dialog for New Gasto */}
          <Dialog
            open={openDialog === "gasto"}
            onOpenChange={(open) => (open ? setOpenDialog("gasto") : setOpenDialog(null))}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                <DialogDescription>Ingresa los detalles de tu nuevo gasto</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo-gasto">Tipo de Gasto</Label>
                  <select
                    id="tipo-gasto"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.esGastoFijo ? "fijo" : formData.esGastoFijo === false ? "variable" : ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, esGastoFijo: e.target.value === "fijo" }))}
                    required
                  >
                    <option value="">Selecciona el tipo de gasto</option>
                    <option value="fijo">Gasto Fijo</option>
                    <option value="variable">Gasto Variable</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion-gasto">Descripción</Label>
                  <Input
                    id="descripcion-gasto"
                    placeholder="Ej: Supermercado, Restaurante, etc."
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cantidad-gasto">Cantidad</Label>
                  <Input
                    id="cantidad-gasto"
                    type="number"
                    placeholder="0.00"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                  />
                </div>
                {!formData.esGastoFijo && formData.esGastoFijo !== null && (
                  <div className="grid gap-2">
                    <Label htmlFor="fecha-gasto">Fecha</Label>
                    <div className="relative">
                      <Input 
                        id="fecha-gasto" 
                        type="date" 
                        value={formData.fecha || new Date().toISOString().split("T")[0]}
                        onChange={handleInputChange} 
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
                {formData.esGastoFijo && (
                  <div className="grid gap-2">
                    <Label htmlFor="frecuencia-gasto">Frecuencia</Label>
                    <select
                      id="frecuencia-gasto"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.frecuencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, frecuencia: e.target.value }))}
                      required
                    >
                      <option value="">Selecciona la frecuencia</option>
                      {frecuencias.map((freq) => (
                        <option key={freq.id} value={freq.id}>
                          {freq.Tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for Edit Transaction - Ahora permite editar descripción para ambos */}
          <Dialog
            open={openDialog === "editar"}
            onOpenChange={(open) => (open ? setOpenDialog("editar") : setOpenDialog(null))}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Transacción</DialogTitle>
                <DialogDescription>Modifica los detalles de la transacción</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="descripcion-editar">Descripción</Label>
                  <Input
                    id="descripcion-editar"
                    placeholder="Descripción"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cantidad-editar">Cantidad</Label>
                  <Input
                    id="cantidad-editar"
                    type="number"
                    placeholder="0.00"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                  />
                </div>
                {formData.esGastoFijo ? (
                  <div className="grid gap-2">
                    <Label htmlFor="frecuencia-editar">Frecuencia</Label>
                    <select
                      id="frecuencia-editar"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.frecuencia}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Selecciona la frecuencia</option>
                      {frecuencias.map((freq) => (
                        <option key={freq.id} value={freq.id}>
                          {freq.Tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="fecha-editar">Fecha</Label>
                    <div className="relative">
                      <Input id="fecha-editar" type="date" value={formData.fecha} onChange={handleInputChange} />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
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
                <Button
                  className={
                    transaccionActual?.tipo === "ingreso"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIngresos.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {transacciones.filter((t) => t.tipo === "ingreso").length} transacciones
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalGastos.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {transacciones.filter((t) => t.tipo === "gasto").length} transacciones
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {balance >= 0 ? "Balance positivo" : "Balance negativo"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transacciones.length}</div>
            <div className="text-xs text-muted-foreground">
              {transacciones.filter((t) => t.tipo === "ingreso").length} ingresos,{" "}
              {transacciones.filter((t) => t.tipo === "gasto").length} gastos
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="ingreso">Ingresos</TabsTrigger>
              <TabsTrigger value="gasto">Gastos Variables</TabsTrigger>
              <TabsTrigger value="gasto-fijo">Gastos Fijos</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar transacción..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Filtrar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filtrar por Fecha</DialogTitle>
                  <DialogDescription>Selecciona el rango de fechas para filtrar las transacciones</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Período</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={periodoSeleccionado}
                      onChange={(e) => handlePeriodoChange(e.target.value)}
                    >
                      <option value="personalizado">Personalizado</option>
                      <option value="semana">Última semana</option>
                      <option value="mes">Último mes</option>
                      <option value="año">Último año</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha-inicio">Fecha Inicio</Label>
                    <Input
                      id="fecha-inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => {
                        setFechaInicio(e.target.value)
                        setPeriodoSeleccionado("personalizado")
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha-fin">Fecha Fin</Label>
                    <Input
                      id="fecha-fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => {
                        setFechaFin(e.target.value)
                        setPeriodoSeleccionado("personalizado")
                      }}
                    />
                  </div>
                </div>
                <DialogFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleLimpiarFiltros}
                  >
                    Limpiar Filtros
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsFilterDialogOpen(false)
                        setFechaInicio("")
                        setFechaFin("")
                        setPeriodoSeleccionado("personalizado")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleFilter} disabled={!fechaInicio || !fechaFin}>
                      {isFetching ? "Filtrando..." : "Aplicar Filtro"}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isFetching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando transacciones...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>{activeTab === "gasto-fijo" ? "Frecuencia" : "Fecha"}</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransacciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No se encontraron transacciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransacciones.map((transaccion) => (
                      <TableRow key={transaccion.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                transaccion.tipo === "ingreso"
                                  ? "bg-green-100 dark:bg-green-900"
                                  : "bg-red-100 dark:bg-red-900"
                              }`}
                            >
                              {transaccion.tipo === "ingreso" ? (
                                <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <span className="capitalize">{transaccion.tipo}</span>
                          </div>
                        </TableCell>
                        <TableCell>{transaccion.descripcion}</TableCell>
                        <TableCell>
                          {transaccion.esGastoFijo ? 
                            getFrecuenciaText(transaccion.frecuencia) : 
                            formatDate(transaccion.fecha)
                          }
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            transaccion.tipo === "ingreso"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaccion.tipo === "ingreso" ? "+" : "-"}${typeof transaccion.cantidad === 'number' ? transaccion.cantidad.toLocaleString() : ''}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(transaccion)}>
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
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la transacción.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleDelete(transaccion)}
                                  >
                                    {isLoading ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Eliminando...
                                      </>
                                    ) : (
                                      "Eliminar"
                                    )}
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
        </Card>
      </div>
    </div>
  )
}