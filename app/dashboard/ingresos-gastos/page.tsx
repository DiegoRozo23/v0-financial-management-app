"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, Calendar, CreditCard, Filter, Plus, Search, Trash2, Edit, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { exportAsCSV, exportAsExcel, exportAsPDF, formatDataForExport } from "@/utils/export-utils"
import { apiService, type Ingreso, type Gasto, type Categoria } from "@/services/api-service"

// Tipo combinado para transacciones
type Transaccion = (Ingreso | Gasto) & { tipo: "ingreso" | "gasto" }

export default function IngresosGastosPage() {
  const [activeTab, setActiveTab] = useState("todos")
  const [openDialog, setOpenDialog] = useState<"ingreso" | "gasto" | "editar" | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [transaccionActual, setTransaccionActual] = useState<Transaccion | null>(null)
  const [formData, setFormData] = useState({
    concepto: "",
    monto: "",
    categoria: "",
    fecha: new Date().toISOString().split("T")[0],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [error, setError] = useState<string | null>(null)

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      setError(null)
      try {
        // Cargar ingresos
        const ingresos = await apiService.getIngresos()
        const ingresosFormateados = ingresos.map((ingreso) => ({
          ...ingreso,
          tipo: "ingreso" as const,
        }))

        // Cargar gastos
        const gastos = await apiService.getGastos()
        const gastosFormateados = gastos.map((gasto) => ({
          ...gasto,
          tipo: "gasto" as const,
        }))

        // Combinar transacciones
        setTransacciones([...ingresosFormateados, ...gastosFormateados])

        // Cargar categorías
        const categoriasData = await apiService.getCategorias()
        setCategorias(categoriasData)
      } catch (err) {
        console.error("Error al cargar datos:", err)
        setError("Error al cargar los datos. Por favor, intenta de nuevo más tarde.")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const filteredTransacciones = transacciones
    .filter((t) => (activeTab === "todos" ? true : t.tipo === activeTab))
    .filter(
      (t) =>
        searchTerm === "" ||
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const categoriasIngresos = categorias.filter((cat) => cat.tipo === "ingreso").map((cat) => cat.nombre)

  const categoriasGastos = categorias.filter((cat) => cat.tipo === "gasto").map((cat) => cat.nombre)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id.split("-")[0]]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, categoria: value }))
  }

  const resetForm = () => {
    setFormData({
      concepto: "",
      monto: "",
      categoria: "",
      fecha: new Date().toISOString().split("T")[0],
    })
    setTransaccionActual(null)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    // Validación básica
    if (!formData.concepto || !formData.monto || !formData.categoria || !formData.fecha) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      // Asegurarse de que el monto sea un número
      const montoNumerico = Number.parseFloat(formData.monto)

      // Crear objeto con la estructura correcta según la API
      const data = {
        concepto: formData.concepto,
        monto: montoNumerico,
        categoria: formData.categoria,
        fecha: formData.fecha,
      }

      if (transaccionActual) {
        // Actualizar transacción existente
        if (transaccionActual.tipo === "ingreso") {
          await apiService.updateIngreso(transaccionActual.id!, data as Ingreso)
        } else {
          await apiService.updateGasto(transaccionActual.id!, data as Gasto)
        }

        // Actualizar estado local
        setTransacciones((prev) => prev.map((t) => (t.id === transaccionActual.id ? { ...t, ...data } : t)))

        toast({
          title: "Transacción actualizada",
          description: `Se ha actualizado "${formData.concepto}" correctamente.`,
        })
      } else {
        // Crear nueva transacción
        let newTransaccion: Transaccion

        if (openDialog === "ingreso") {
          const response = await apiService.createIngreso(data as Ingreso)
          newTransaccion = { ...response, tipo: "ingreso" }
        } else {
          const response = await apiService.createGasto(data as Gasto)
          newTransaccion = { ...response, tipo: "gasto" }
        }

        setTransacciones((prev) => [...prev, newTransaccion])

        toast({
          title: "Transacción creada",
          description: `Se ha registrado "${formData.concepto}" correctamente.`,
        })
      }

      setOpenDialog(null)
      resetForm()
    } catch (err) {
      console.error("Error al guardar transacción:", err)
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Ocurrió un error al guardar la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (transaccion: Transaccion) => {
    setTransaccionActual(transaccion)
    setFormData({
      concepto: transaccion.concepto,
      monto: transaccion.monto.toString(),
      categoria: transaccion.categoria,
      fecha: transaccion.fecha,
    })
    setOpenDialog("editar")
  }

  const handleDelete = async (id: number, tipo: "ingreso" | "gasto") => {
    try {
      if (tipo === "ingreso") {
        await apiService.deleteIngreso(id)
      } else {
        await apiService.deleteGasto(id)
      }

      // Actualizar estado local
      setTransacciones(transacciones.filter((t) => t.id !== id))

      toast({
        title: "Transacción eliminada",
        description: "La transacción ha sido eliminada correctamente.",
      })
    } catch (err) {
      console.error("Error al eliminar transacción:", err)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar la transacción. Inténtalo de nuevo.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    setExportLoading(true)

    setTimeout(() => {
      const dataToExport = formatDataForExport(filteredTransacciones, "ingresos-gastos")
      const fileName = `transacciones_${new Date().toISOString().split("T")[0]}`

      switch (format) {
        case "excel":
          exportAsExcel(dataToExport, fileName)
          break
        case "pdf":
          exportAsPDF(dataToExport, fileName, "Reporte de Ingresos y Gastos")
          break
        case "csv":
          exportAsCSV(dataToExport, fileName)
          break
      }

      setExportLoading(false)
      toast({
        title: "Exportación completada",
        description: `Tus transacciones han sido exportadas en formato ${format.toUpperCase()}.`,
      })
      setShowExportOptions(false)
    }, 1000)
  }

  // Calcular totales
  const totalIngresos = transacciones.filter((t) => t.tipo === "ingreso").reduce((sum, t) => sum + t.monto, 0)

  const totalGastos = transacciones.filter((t) => t.tipo === "gasto").reduce((sum, t) => sum + t.monto, 0)

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando datos...</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Ingresos y Gastos</h1>
          <p className="text-muted-foreground">Administra tus transacciones financieras.</p>
        </div>
        <div className="flex gap-2">
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
                  <Label htmlFor="concepto-ingreso">Concepto</Label>
                  <Input
                    id="concepto-ingreso"
                    placeholder="Ej: Salario, Freelance, etc."
                    value={formData.concepto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monto-ingreso">Monto</Label>
                  <Input
                    id="monto-ingreso"
                    type="number"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria-ingreso">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasIngresos.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="concepto-gasto">Concepto</Label>
                  <Input
                    id="concepto-gasto"
                    placeholder="Ej: Supermercado, Restaurante, etc."
                    value={formData.concepto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monto-gasto">Monto</Label>
                  <Input
                    id="monto-gasto"
                    type="number"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria-gasto">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasGastos.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha-gasto">Fecha</Label>
                  <div className="relative">
                    <Input id="fecha-gasto" type="date" value={formData.fecha} onChange={handleInputChange} />
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
                <Button className="bg-red-600 hover:bg-red-700" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
                  <Label htmlFor="concepto-editar">Concepto</Label>
                  <Input
                    id="concepto-editar"
                    placeholder="Concepto"
                    value={formData.concepto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="monto-editar">Monto</Label>
                  <Input
                    id="monto-editar"
                    type="number"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoria-editar">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {transaccionActual?.tipo === "ingreso"
                        ? categoriasIngresos.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))
                        : categoriasGastos.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha-editar">Fecha</Label>
                  <div className="relative">
                    <Input id="fecha-editar" type="date" value={formData.fecha} onChange={handleInputChange} />
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
            <div className="text-xs text-muted-foreground">Todos tus ingresos registrados</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalGastos.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Todos tus gastos registrados</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalIngresos - totalGastos).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Diferencia entre ingresos y gastos</div>
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
              <TabsTrigger value="gasto">Gastos</TabsTrigger>
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrar</span>
            </Button>
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

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransacciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>{transaccion.concepto}</TableCell>
                      <TableCell>{transaccion.categoria}</TableCell>
                      <TableCell>{formatDate(transaccion.fecha)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          transaccion.tipo === "ingreso"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaccion.tipo === "ingreso" ? "+" : "-"}${transaccion.monto.toLocaleString()}
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
                                  onClick={() => handleDelete(transaccion.id!, transaccion.tipo)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
