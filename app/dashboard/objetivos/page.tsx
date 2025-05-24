"use client"

import type React from "react"
import ReactDOM from "react-dom"
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
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "@/components/ui/chart"
import { apiService, type Objetivo, type Frecuencia } from "@/services/api-service"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Tipo extendido para manejar objetivos con datos adicionales de progreso
interface ObjetivoExtendido extends Omit<Objetivo, 'frecuencia'> {
  porcentaje: number
  actual: number
  completado?: boolean
  fechaCompletado?: string
  nombre: string
  frecuencia?: Frecuencia
  descripcion: string
}

export default function ObjetivosPage() {
  const [openDialog, setOpenDialog] = useState<"nuevo" | "editar" | "ahorro" | "advertencia" | null>(null)
  const [objetivos, setObjetivos] = useState<ObjetivoExtendido[]>([])
  const [objetivosCompletados, setObjetivosCompletados] = useState<ObjetivoExtendido[]>([])
  const [objetivoActual, setObjetivoActual] = useState<ObjetivoExtendido | null>(null)
  const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([]) // Podría ser usado por otros modelos
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    nombre: "", // Este será mapeado a 'descripcion' en el backend
    descripcion: "", // Este campo del frontend NO se enviará al backend para 'ObjetivosFinancieros'
    actual: "",
    meta: "",
    frecuencia: { id: 0, Tipo: '' }, // Este campo del frontend NO se enviará al backend para 'ObjetivosFinancieros'
    fechaInicio: new Date().toISOString().split("T")[0], // NO se enviará al backend para 'ObjetivosFinancieros'
    fechaFin: "", // NO se enviará al backend para 'ObjetivosFinancieros'
  })
  const [montoAhorro, setMontoAhorro] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGraphMinimized, setIsGraphMinimized] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const objectivesPerPage = 5
  const [activeTab, setActiveTab] = useState<"activos" | "completados">("activos")
  const [progresoFilter, setProgresoFilter] = useState<string>("todos")

  // Función para filtrar objetivos por progreso
  const filterObjetivosByProgreso = (objetivos: ObjetivoExtendido[]) => {
    switch (progresoFilter) {
      case "0-25":
        return objetivos.filter(obj => obj.porcentaje <= 25);
      case "26-50":
        return objetivos.filter(obj => obj.porcentaje > 25 && obj.porcentaje <= 50);
      case "51-75":
        return objetivos.filter(obj => obj.porcentaje > 50 && obj.porcentaje <= 75);
      case "76-99":
        return objetivos.filter(obj => obj.porcentaje > 75 && obj.porcentaje < 100);
      case "completados":
        return objetivos.filter(obj => obj.porcentaje === 100);
      case "pendientes":
        return objetivos.filter(obj => obj.porcentaje < 100);
      default:
        return objetivos;
    }
  }

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

        console.log("Frecuencias data received:", frecuenciasData);

        // Transformar objetivos para incluir campos adicionales de progreso
        const objetivosExtendidos = objetivosData.map((objetivo) => ({
          ...objetivo,
          // Si tu backend NO devuelve 'nombre' pero sí 'descripcion',
          // aquí deberías mapear objetivo.descripcion a objetivo.nombre si lo usas en el UI.
          // Asumimos que apiService.Objetivo ya tiene 'nombre' y 'frecuencia'.
          // Si el backend solo devuelve 'descripcion', usa objetivo.descripcion para el 'nombre' del frontend.
          nombre: objetivo.nombre || objetivo.descripcion, // Usa nombre si existe, si no, usa descripcion
          porcentaje: Math.round((objetivo.actual / objetivo.meta) * 100),
          completado: (objetivo.actual >= objetivo.meta), // Determinar si está completado
        }))

        // Separar en activos y completados
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
    const { id, value } = e.target;

    // Ajusta los IDs para que coincidan con los nombres de las propiedades en formData
    let fieldName = id.split("-")[0]; // 'nombre', 'meta', 'actual', 'descripcion', 'fechaInicio'

    setFormData((prev) => {
      return {
        ...prev,
        [fieldName]: value,
      };
    });
  }

  // Frecuencia sigue siendo parte del formulario, pero no se enviará al backend para ObjetivosFinancieros
  const handleSelectChange = (value: string) => {
    const selectedFrecuencia = frecuencias.find((f) => f.id.toString() === value);
    if (selectedFrecuencia) {
      setFormData((prev) => ({ ...prev, frecuencia: selectedFrecuencia }));
    } else {
      setFormData((prev) => ({ ...prev, frecuencia: { id: 0, Tipo: '' } }));
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      actual: "",
      meta: "",
      frecuencia: { id: 0, Tipo: '' },
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: "",
    })
    setObjetivoActual(null)
    setMontoAhorro("")
  }

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    // Validación básica
    if (!formData.nombre || !formData.meta || !formData.actual) {
      toast({
        title: "Error",
        description: "Por favor completa el nombre, meta y monto actual del objetivo.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const montoActual = Number.parseFloat(formData.actual);
    const montoMeta = Number.parseFloat(formData.meta);
    const porcentaje = Math.round((montoActual / montoMeta) * 100);

    if (porcentaje > 100) {
      setOpenDialog("advertencia");
      setIsLoading(false);
      return;
    }

    try {
      // Prepara los datos para enviar al backend
      const dataToSave = {
        descripcion: formData.nombre,
        meta: Number.parseFloat(formData.meta),
        actual: Number.parseFloat(formData.actual || "0"),
        nombre: formData.nombre,
        frecuencia: formData.frecuencia
      } as Omit<Objetivo, "id">;

      if (objetivoActual) {
        // Actualizar objetivo existente
        // Asegúrate de que objetivoActual.id no sea undefined antes de llamar a la API
        if (objetivoActual.id === undefined) {
             throw new Error("ID del objetivo no definido para actualizar.");
        }
        const updatedObjetivo = await apiService.updateObjetivo(objetivoActual.id, dataToSave);

        // Actualizar estado local
        const updatedObjetivos = objetivos.map((obj) =>
          obj.id === objetivoActual.id
            ? {
              ...obj, // Mantén los campos que no se envían al backend (como nombre original, frecuencia)
              ...updatedObjetivo, // Sobreescribe con la respuesta del backend (descripcion, meta, actual)
              nombre: formData.nombre, // Asegura que el nombre en el UI se actualice
              porcentaje: Math.round((updatedObjetivo.actual / updatedObjetivo.meta) * 100),
            }
            : obj
        );
        setObjetivos(updatedObjetivos);

        toast({
          title: "Objetivo actualizado",
          description: `Se ha actualizado "${formData.nombre}" correctamente.`,
        });
      } else {
        // Crear nuevo objetivo
        console.log("Data to save (create):", dataToSave);
        const newObjetivoBackend = await apiService.createObjetivo(dataToSave); // Recibe 'descripcion', 'meta', 'actual'

        const objetivoExtendido: ObjetivoExtendido = {
          ...newObjetivoBackend,
          nombre: formData.nombre, // Usa el nombre del formulario para el display en el UI
          frecuencia: frecuencias.find(f => f.id === formData.frecuencia.id), // Encuentra la frecuencia seleccionada por ID
          porcentaje: Math.round((newObjetivoBackend.actual / newObjetivoBackend.meta) * 100),
          completado: (newObjetivoBackend.actual >= newObjetivoBackend.meta),
        };

        setObjetivos([...objetivos, objetivoExtendido]);

        toast({
          title: "Objetivo creado",
          description: `Se ha creado \"${formData.nombre}\" correctamente.`,
        });
      }
    } catch (err) {
      console.error("Error al guardar objetivo:", err);
      toast({
        title: "Error",
        description: "No se pudo guardar el objetivo. Intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setOpenDialog(null);
      resetForm();
    }
  };

  const handleEdit = (objetivo: ObjetivoExtendido) => {
    // Validar que el monto actual no supere la meta
    const porcentaje = Math.round((Number(objetivo.actual) / Number(objetivo.meta)) * 100);
    if (porcentaje > 100) {
      toast({
        title: "Error",
        description: "El monto actual no puede superar el monto objetivo.",
        variant: "destructive",
      });
      return;
    }

    setObjetivoActual(objetivo);
    setFormData({
      nombre: objetivo.nombre,
      descripcion: objetivo.descripcion || '',
      actual: objetivo.actual.toString(),
      meta: objetivo.meta.toString(),
      frecuencia: objetivo.frecuencia || { id: 0, Tipo: '' },
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: "",
    });
    setOpenDialog("editar");
  }

   // Function to open the "Agregar Ahorro" dialog for a specific objective
   const handleAgregarAhorroDialog = (objetivo: ObjetivoExtendido) => {
    setObjetivoActual(objetivo);
    setOpenDialog("ahorro");
  };


  const handleDelete = async (id: number) => {
    setIsLoading(true)
    try {
      await apiService.deleteObjetivo(id)

      // Actualizar estado local
      setObjetivos(objetivos.filter((obj) => obj.id !== id))
      setObjetivosCompletados(objetivosCompletados.filter((obj) => obj.id !== id)) // También de completados

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

  const handleAgregarAhorro = async () => {
    setIsLoading(true);

    // Validación básica
    if (!montoAhorro || Number.parseFloat(montoAhorro) <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (objetivoActual) {
      const monto = Number.parseFloat(montoAhorro);
      const nuevoActual = objetivoActual.actual + monto;
      const nuevoPorcentaje = Math.round((nuevoActual / objetivoActual.meta) * 100);

      if (nuevoPorcentaje > 100) {
        setOpenDialog("advertencia");
        setIsLoading(false);
        return;
      }

      try {
        // Prepara los datos para enviar al backend (solo 'descripcion', 'meta', 'actual')
        const dataToUpdateForBackend = {
          descripcion: objetivoActual.nombre,
          meta: objetivoActual.meta,
          actual: nuevoActual,
          nombre: objetivoActual.nombre,
          frecuencia: objetivoActual.frecuencia
        } as Omit<Objetivo, "id">;

        // Asegúrate de que objetivoActual.id no sea undefined antes de llamar a la API
        if (objetivoActual.id === undefined) {
            throw new Error("ID del objetivo no definido para agregar ahorro.");
        }

        const updatedObjetivoBackend = await apiService.updateObjetivo(objetivoActual.id, dataToUpdateForBackend);

        // Actualiza el estado local con la respuesta del backend
        // Primero, intenta encontrar y actualizar en la lista de objetivos activos
        let foundAndUpdated = false;
        const updatedObjetivos = objetivos.map((obj) => {
            if (obj.id === objetivoActual.id) {
                foundAndUpdated = true;
                return {
                    ...obj,
                    actual: updatedObjetivoBackend.actual, // Usa el valor 'actual' devuelto por el backend
                    porcentaje: nuevoPorcentaje,
                };
            }
            return obj;
        });
        setObjetivos(updatedObjetivos);

         // Si no se encontró en objetivos activos, intenta en objetivos completados (aunque no debería pasar si es activo)
        let updatedObjetivosCompletados = objetivosCompletados;
        if (!foundAndUpdated) {
             updatedObjetivosCompletados = objetivosCompletados.map((obj) => {
                if (obj.id === objetivoActual.id) {
                     return {
                        ...obj,
                        actual: updatedObjetivoBackend.actual,
                        porcentaje: nuevoPorcentaje,
                     };
                }
                return obj;
             });
             setObjetivosCompletados(updatedObjetivosCompletados);
        }


        toast({
          title: "Ahorro registrado",
          description: `Se ha agregado $${monto.toLocaleString()} a tu objetivo "${objetivoActual.nombre}".`,
        });

        // Verificar si se completó el objetivo DESPUÉS de actualizar el estado
        // Busca el objetivo actualizado en la lista de objetivos activos
        const latestObjetivo = updatedObjetivos.find(obj => obj.id === objetivoActual.id);

        if (latestObjetivo && latestObjetivo.actual >= latestObjetivo.meta && !latestObjetivo.completado) {
          // Mover a objetivos completados
          const fechaActual = new Date().toISOString().split("T")[0];
          const objetivoCompletado = {
            ...latestObjetivo,
            completado: true,
            fechaCompletado: fechaActual,
            porcentaje: 100, // Asegura que sea 100% al completarse
          };

          setObjetivosCompletados([...objetivosCompletados, objetivoCompletado]);
          setObjetivos(updatedObjetivos.filter((obj) => obj.id !== objetivoActual.id)); // Elimina de activos

          toast({
            title: "¡Felicidades!",
            description: `Has completado tu objetivo "${objetivoActual.nombre}".`,
          });
        }

      } catch (error) {
        console.error("Error al actualizar el objetivo:", error);
        toast({
          title: "Error",
          description: "No se pudo agregar el ahorro. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    }
    setIsLoading(false);
    setOpenDialog(null);
    resetForm();
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }



  // Datos para el gráfico de progreso
  const progresoData = filterObjetivosByProgreso(objetivos)
    .filter(obj => obj.porcentaje < 100)
    .sort((a, b) => b.porcentaje - a.porcentaje) // Ordenar de mayor a menor
    .map((obj) => ({
      ...obj,
      name: obj.nombre,
      porcentaje: obj.porcentaje,
      montoActual: obj.actual,
      montoMeta: obj.meta,
      color: obj.porcentaje >= 75 ? '#22c55e' : // Verde para 75-100%
             obj.porcentaje >= 50 ? '#84cc16' : // Verde-amarillo para 50-75%
             obj.porcentaje >= 25 ? '#eab308' : // Amarillo para 25-50%
             '#f97316' // Naranja para 0-25%
    }))

  // Filtrar objetivos según búsqueda y filtro de progreso
  const filteredObjetivos = filterObjetivosByProgreso(
    objetivos.filter(objetivo =>
      (objetivo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (objetivo.descripcion && objetivo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      objetivo.porcentaje < 100
    )
  );

  const filteredObjetivosCompletados = objetivosCompletados.filter((objetivo: ObjetivoExtendido) =>
    objetivo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    objetivo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasMoreObjectives = objetivos.length > objectivesPerPage * currentPage

  const scrollToObjetivo = (id: number) => {
    const element = document.getElementById(`objetivo-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

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
      
      {/* Modal de advertencia */}
      <AlertDialog open={openDialog === "advertencia"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Monto excede el límite</AlertDialogTitle>
            <AlertDialogDescription>
              El monto ingresado superaría el 100% del objetivo.

              {!objetivoActual && (
                <span className="block mt-2">
                  El monto actual no puede ser mayor que el monto objetivo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpenDialog(null)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Objetivos Financieros</h1>
          <p className="text-muted-foreground">Establece y haz seguimiento a tus metas financieras.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog
            open={openDialog === "nuevo"}
            onOpenChange={(open) => (open ? setOpenDialog("nuevo") : setOpenDialog(null))}
          >
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
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
                  <Label htmlFor="nombre-nuevo">Nombre del Objetivo</Label>
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
                {/* NOTA: El campo Frecuencia no es parte del modelo 'ObjetivosFinancieros'
                            que proporcionaste en Django. Si es necesario para otros modelos,
                            mantenlo, pero no se enviará para este objetivo. */}
                <div className="grid gap-2">
                  <Label htmlFor="frecuencia-nuevo">Frecuencia </Label>
                  <Select value={formData.frecuencia.id?.toString()} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {frecuencias.length > 0 ? (
                        frecuencias.map((frecuencia) => (
                          <SelectItem key={frecuencia.id} value={frecuencia.id.toString()}>
                            {frecuencia.Tipo}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="loading">Cargando...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actual-nuevo">Monto Actual</Label>
                  <Input
                    id="actual-nuevo"
                    type="number"
                    placeholder="0.00"
                    value={formData.actual}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="descripcion-nuevo">Descripción Adicional </Label>
                  <Input
                    id="descripcion-nuevo"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                </div>
                {/* NOTA: Los campos de fecha tampoco son parte del modelo 'ObjetivosFinancieros'. */}
                <div className="grid gap-2">
                  <Label htmlFor="fechaInicio-nuevo">Fecha Inicio </Label>
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

          {/* Diálogo de Editar Objetivo - Similar al de Nuevo, con los mismos ajustes */}
          <Dialog
            open={openDialog === "editar"}
            onOpenChange={(open) => (open ? setOpenDialog("editar") : setOpenDialog(null))}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Objetivo</DialogTitle>
                <DialogDescription>Modifica los detalles de tu meta financiera</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre-editar">Nombre del Objetivo</Label>
                  <Input
                    id="nombre-editar"
                    placeholder="Ej: Fondo de emergencia, Vacaciones, etc."
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meta-editar">Monto Objetivo</Label>
                  <Input
                    id="meta-editar"
                    type="number"
                    placeholder="0.00"
                    value={formData.meta}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="frecuencia-editar">Frecuencia</Label>
                  <Select value={formData.frecuencia.id?.toString()} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {frecuencias.length > 0 ? (
                        frecuencias.map((frecuencia) => (
                          <SelectItem key={frecuencia.id} value={frecuencia.id.toString()}>
                            {frecuencia.Tipo}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="loading">Cargando...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actual-editar">Monto Actual</Label>
                  <Input
                    id="actual-editar"
                    type="number"
                    placeholder="0.00"
                    value={formData.actual}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion-editar">Descripción Adicional </Label>
                  <Input
                    id="descripcion-editar"
                    
                    value={formData.descripcion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaInicio-editar">Fecha Inicio</Label>
                  <Input id="fechaInicio-editar" type="date" value={formData.fechaInicio} onChange={handleInputChange} />
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
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo para agregar ahorro - Si decides implementarlo, asegúrate de que
              sólo actualice el campo 'actual' del objetivo en el backend. */}
          <Dialog
            open={openDialog === "ahorro"}
            onOpenChange={(open) => (open ? setOpenDialog("ahorro") : setOpenDialog(null))}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Ahorro a {objetivoActual?.nombre}</DialogTitle>
                <DialogDescription>Ingresa el monto que deseas añadir a este objetivo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="montoAhorro">Monto a agregar</Label>
                  <Input
                    id="montoAhorro"
                    type="number"
                    placeholder="0.00"
                    value={montoAhorro}
                    onChange={(e) => setMontoAhorro(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpenDialog(null); resetForm() }}>
                  Cancelar
                </Button>
                <Button onClick={handleAgregarAhorro} disabled={isLoading}>
                  {isLoading ? "Agregando..." : "Agregar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <Tabs defaultValue="activos" value={activeTab} onValueChange={(value) => {
          setActiveTab(value as "activos" | "completados");
          if (value === "completados") {
            setProgresoFilter("todos");
          }
        }} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="activos">Objetivos Activos</TabsTrigger>
            <TabsTrigger value="completados">Objetivos Completados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Input
              type="text"
              placeholder="Buscar objetivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[350px] pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {activeTab === "activos" && (
            <Select value={progresoFilter} onValueChange={setProgresoFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filtrar por progreso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="0-25">0-25%</SelectItem>
                <SelectItem value="26-50">26-50%</SelectItem>
                <SelectItem value="51-75">51-75%</SelectItem>
                <SelectItem value="76-99">76-99%</SelectItem>
                <SelectItem value="pendientes">Sin completar</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Gráfico de progreso */}
      {objetivos.length > 0 && !searchTerm && activeTab === "activos" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Progreso de Objetivos</CardTitle>
              <CardDescription>Visualización del progreso hacia tus metas financieras</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsGraphMinimized(!isGraphMinimized)}
              className="ml-2"
            >
              {isGraphMinimized ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/></svg>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className={`transition-all duration-300 ease-in-out ${isGraphMinimized ? 'h-0 opacity-0' : 'h-[250px] opacity-100'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={progresoData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const objetivo = data.activePayload[0].payload;
                      if (objetivo && objetivo.id) {
                        scrollToObjetivo(objetivo.id);
                      }
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(str) => {
                      return str.split(' ').slice(0, 2).join(' ');
                    }}
                  />
                  <YAxis
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (props.payload) {
                        const { montoActual, montoMeta } = props.payload;
                        return [
                          <div key="tooltip" className="space-y-1">
                            <p>Progreso: {value}%</p>
                            <p>Actual: ${montoActual?.toLocaleString()}</p>
                            <p>Meta: ${montoMeta?.toLocaleString()}</p>
                          </div>
                        ];
                      }
                      return [`${value}%`, 'Progreso'];
                    }}
                  />
                  <Bar 
                    dataKey="porcentaje" 
                    name="Progreso" 
                    cursor="pointer"
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  >
                    {progresoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de objetivos */}
      {filteredObjetivos.length > 0 && !error && activeTab === "activos" && (
        <div className="space-y-4">
          {filteredObjetivos
            .filter(obj => obj.porcentaje < 100)
            .map((objetivo) => (
              <Card 
                key={objetivo.id!} 
                id={`objetivo-${objetivo.id}`}
                className="overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer group"
                onClick={() => scrollToObjetivo(objetivo.id!)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{objetivo.nombre}</h3>
                      {objetivo.descripcion && objetivo.descripcion !== objetivo.nombre && (
                        <p className="text-sm text-muted-foreground mt-1">{objetivo.descripcion}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Inicio: {formatDate(formData.fechaInicio)}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="text-sm text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="font-medium">Actual: ${objetivo.actual?.toLocaleString()}</p>
                        <p className="text-muted-foreground">Falta: ${(objetivo.meta - objetivo.actual).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-row gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAgregarAhorroDialog(objetivo);
                          }}
                          className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-950 bg-background"
                        >
                          <Plus className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Agregar</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(objetivo);
                          }}
                          className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 bg-background"
                        >
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 bg-background"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Eliminar</span>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(objetivo.id || 0);
                                }}
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">
                          Progreso: ${objetivo.actual?.toLocaleString()} de ${objetivo.meta?.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {objetivo.porcentaje}%
                        </span>
                      </div>
                      <Progress 
                        value={objetivo.porcentaje} 
                        className="h-3 bg-gray-100 dark:bg-gray-800" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                        <p className="text-muted-foreground">Meta</p>
                        <p className="font-semibold text-lg">${objetivo.meta?.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                        <p className="text-muted-foreground">Falta</p>
                        <p className="font-semibold text-lg text-orange-600 dark:text-orange-400">
                          ${(objetivo.meta - objetivo.actual).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {((activeTab === "activos" && filteredObjetivos.length === 0) || 
        (activeTab === "completados" && filteredObjetivosCompletados.length === 0)) && !error && (
        <Card className="p-6 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg">
              {searchTerm 
                ? `No se encontraron objetivos que coincidan con "${searchTerm}"`
                : activeTab === "completados"
                ? "No hay objetivos completados"
                : "No hay objetivos activos"}
            </p>
          </div>
        </Card>
      )}

      {/* Objetivos completados */}
      {filteredObjetivosCompletados.length > 0 && activeTab === "completados" && (
        <div className="space-y-4">
          {filteredObjetivosCompletados.map((objetivo) => (
            <Card key={objetivo.id!} className="overflow-hidden border-green-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center">
                      {objetivo.nombre}
                      <Check className="h-5 w-5 text-green-500 ml-2" />
                    </h3>
                    {objetivo.fechaCompletado && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Completado el: {formatDate(objetivo.fechaCompletado)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Inicio: {formatDate(formData.fechaInicio)}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950 bg-background"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el objetivo completado.
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

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Meta alcanzada</span>
                      <span className="text-sm font-semibold text-green-600">100%</span>
                    </div>
                    <Progress value={100} className="h-3 bg-gray-100" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <p className="text-muted-foreground">Meta alcanzada</p>
                      <p className="font-semibold text-lg">${objetivo.meta?.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <p className="text-muted-foreground">Ahorrado</p>
                      <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                        ${objetivo.actual?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}