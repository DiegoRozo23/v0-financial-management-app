"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
  PiggyBank,
  Coins,
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
import { apiService, type Ahorro } from "@/services/api-service"

export default function AhorrosPage() {
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [openAddMoneyDialog, setOpenAddMoneyDialog] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [ahorros, setAhorros] = useState<Ahorro[]>([])
  const [ahorroActual, setAhorroActual] = useState<Ahorro | null>(null)
  const [selectedAhorro, setSelectedAhorro] = useState<Ahorro | null>(null)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [formData, setFormData] = useState({
    nombre: "",
    cantidad: "",
    fecha: new Date().toISOString().split("T")[0],
    fecha_Final: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchAhorros = async () => {
      setIsFetching(true)
      setError(null)

      try {
        const ahorrosData = await apiService.getAhorros()
        // Ordenar por fecha_Final (más cercano primero) o fecha de inicio si final no existe
        setAhorros(ahorrosData.sort((a, b) => {
            const dateA = new Date(a.fecha_Final || a.fecha).getTime();
            const dateB = new Date(b.fecha_Final || b.fecha).getTime();
            return dateA - dateB;
        }));
      } catch (err) {
        console.error("Error al cargar ahorros:", err)
        setError("No se pudieron cargar los ahorros. Intente nuevamente más tarde.")
      } finally {
        setIsFetching(false)
      }
    }

    fetchAhorros()
  }, [])

  const totalAhorros = ahorros.reduce((sum, ahorro) => sum + ahorro.cantidad, 0)

  const hoy = new Date()
  const unMesAtras = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate())
  const ahorroMensual = ahorros
    .filter((ahorro) => new Date(ahorro.fecha) >= unMesAtras)
    .reduce((sum, ahorro) => sum + ahorro.cantidad, 0)

  // Filtrado por nombre o descripción (si la descripción se envía desde el backend)
  const filteredAhorros = ahorros.filter(
    (ahorro) =>
      searchTerm === "" ||
      ahorro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ahorro.descripcion && ahorro.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    const fieldName = id.split("-")[0]
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      cantidad: "",
      fecha: new Date().toISOString().split("T")[0],
      fecha_Final: "",
    })
    setAhorroActual(null)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    if (!formData.nombre || !formData.cantidad || !formData.fecha) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios: Nombre, Cantidad y Fecha de Inicio.",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      const ahorroDataToSend = {
        nombre: formData.nombre,
        cantidad: Number.parseFloat(formData.cantidad),
        fecha: formData.fecha,
        fecha_Final: formData.fecha_Final || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      }

      let resultAhorro: Ahorro;
      if (ahorroActual) {
        // Actualizar ahorro existente
        resultAhorro = await apiService.updateAhorro(ahorroActual.id || 0, ahorroDataToSend as Ahorro)
        const updatedAhorros = ahorros.map((ahorro) => (ahorro.id === ahorroActual.id ? resultAhorro : ahorro))
        setAhorros(updatedAhorros.sort((a, b) => {
            const dateA = new Date(a.fecha_Final || a.fecha).getTime();
            const dateB = new Date(b.fecha_Final || b.fecha).getTime();
            return dateA - dateB;
        }));

        toast({
          title: "Ahorro actualizado",
          description: `Se ha actualizado "${formData.nombre}" correctamente.`,
        })
      } else {
        // Crear nuevo ahorro
        resultAhorro = await apiService.createAhorro(ahorroDataToSend as Ahorro)
        setAhorros([resultAhorro, ...ahorros].sort((a, b) => {
            const dateA = new Date(a.fecha_Final || a.fecha).getTime();
            const dateB = new Date(b.fecha_Final || b.fecha).getTime();
            return dateA - dateB;
        }));

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
      cantidad: ahorro.cantidad.toString(),
      fecha: new Date(ahorro.fecha).toISOString().split("T")[0], // Formatear para input type="date"
      fecha_Final: new Date(ahorro.fecha_Final).toISOString().split("T")[0], // Formatear para input type="date"
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: number) => {
    setIsLoading(true)
    try {
      await apiService.deleteAhorro(id)
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
    // Asegurar que la fecha sea válida antes de formatear
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Fecha inválida";
    }
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const handleAddMoney = async () => {
    if (!selectedAhorro || !addMoneyAmount) return;
    
    setIsLoading(true);
    try {
      const newAmount = selectedAhorro.cantidad + Number(addMoneyAmount);
      const updatedAhorro = await apiService.updateAhorro(selectedAhorro.id || 0, {
        ...selectedAhorro,
        cantidad: newAmount
      });
      
      setAhorros(ahorros.map(ahorro => 
        ahorro.id === selectedAhorro.id ? updatedAhorro : ahorro
      ));
      
      toast({
        title: "Dinero añadido",
        description: `Se han añadido $${Number(addMoneyAmount).toLocaleString()} a "${selectedAhorro.nombre}"`,
      });
      
      setOpenAddMoneyDialog(false);
      setAddMoneyAmount("");
      setSelectedAhorro(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo añadir el dinero. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-6 animate-fadeIn">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="animate-slideInLeft">
          <h1 className="text-2xl font-bold tracking-tight">Ahorros</h1>
          <p className="text-muted-foreground">Administra y haz seguimiento de tus ahorros.</p>
        </div>
        <div className="flex gap-2 animate-slideInRight">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ahorro
              </Button>
            </DialogTrigger>
            <DialogContent className="animate-scaleIn">
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
                    className="transition-all duration-300 focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cantidad-ahorro">Cantidad</Label>
                  <Input
                    id="cantidad-ahorro"
                    type="number"
                    placeholder="0.00"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    className="transition-all duration-300 focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha-ahorro">Fecha de Inicio</Label>
                  <Input 
                    id="fecha-ahorro" 
                    type="date" 
                    value={formData.fecha} 
                    onChange={handleInputChange}
                    className="transition-all duration-300 focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fecha_Final-ahorro">Fecha Final</Label>
                  <Input
                    id="fecha_Final-ahorro"
                    type="date"
                    value={formData.fecha_Final}
                    onChange={handleInputChange}
                    className="transition-all duration-300 focus:ring-2 focus:ring-green-500"
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
                  className="transition-all duration-300 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105" 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ahorros</CardTitle>
            <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">${totalAhorros.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Cantidad total acumulada</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ahorro Mensual</CardTitle>
            <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">${ahorroMensual.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {ahorroMensual > 0 ? "Ahorrado este mes" : "Sin ahorros este mes"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mayor Ahorro Individual</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {ahorros.length > 0
                ? `$${ahorros
                    .reduce((max, ahorro) => (ahorro.cantidad > max.cantidad ? ahorro : max), ahorros[0])
                    .cantidad.toLocaleString()}`
                : "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              {ahorros.length > 0
                ? ahorros.reduce((max, ahorro) => (ahorro.cantidad > max.cantidad ? ahorro : max), ahorros[0]).nombre
                : "Sin datos"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ahorros Registrados</CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{ahorros.length}</div>
            <div className="text-xs text-muted-foreground">Total de fondos de ahorro</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 animate-fadeIn">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 transition-all duration-300">Reintentar</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar ahorro por nombre..."
              className="pl-8 w-full sm:w-[300px] transition-all duration-300 focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="icon" className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrar</span>
            </Button>
          </div>
        </div>

        <Card className="animate-fadeIn bg-white dark:bg-gray-800 shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando ahorros...</span>
              </div>
            ) : filteredAhorros.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground animate-fadeIn">
                <PiggyBank className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg">No se encontraron ahorros que coincidan con tu búsqueda.</p>
                <p className="mb-4">Intenta ajustar tu término de búsqueda o crea un nuevo ahorro.</p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105" 
                  onClick={() => setOpenDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Ahorro
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha Inicio</TableHead>
                    <TableHead>Fecha Final</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAhorros.map((ahorro) => (
                    <TableRow 
                      key={ahorro.id} 
                      className="transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-medium">{ahorro.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(ahorro.fecha)}</TableCell>
                      <TableCell>{formatDate(ahorro.fecha_Final)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                        ${ahorro.cantidad.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedAhorro(ahorro);
                              setOpenAddMoneyDialog(true);
                            }}
                            className="text-green-600 hover:text-green-700 transition-all duration-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Coins className="h-4 w-4" />
                            <span className="sr-only">Añadir dinero</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(ahorro)}
                            className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-600 dark:text-red-400 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="animate-scaleIn">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el ahorro{" "}
                                  <span className="font-bold">{ahorro.nombre}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 transition-all duration-300"
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para añadir dinero */}
      <Dialog open={openAddMoneyDialog} onOpenChange={setOpenAddMoneyDialog}>
        <DialogContent className="animate-scaleIn">
          <DialogHeader>
            <DialogTitle>Añadir dinero al ahorro</DialogTitle>
            <DialogDescription>
              Ingresa la cantidad que deseas añadir a "{selectedAhorro?.nombre}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cantidad-añadir">Cantidad a añadir</Label>
              <Input
                id="cantidad-añadir"
                type="number"
                placeholder="0.00"
                value={addMoneyAmount}
                onChange={(e) => setAddMoneyAmount(e.target.value)}
                className="transition-all duration-300 focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenAddMoneyDialog(false);
                setAddMoneyAmount("");
                setSelectedAhorro(null);
              }}
              className="transition-all duration-300 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 transition-all duration-300 hover:scale-105" 
              onClick={handleAddMoney} 
              disabled={isLoading || !addMoneyAmount}
            >
              {isLoading ? "Añadiendo..." : "Añadir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}