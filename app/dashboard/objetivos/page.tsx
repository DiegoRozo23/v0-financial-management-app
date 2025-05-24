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
import { apiService, type Objetivo, type Frecuencia } from "@/services/api-service"


// Tipo extendido para manejar objetivos con datos adicionales de progreso
interface ObjetivoExtendido extends Objetivo {
  porcentaje: number
  actual: number // Aseguramos que 'actual' esté presente y sea numérico
  completado?: boolean
  fechaCompletado?: string
  // Si tu tipo 'Objetivo' real del api-service incluye 'nombre', 'descripcion' y 'frecuencia',
  // asegúrate de que estén definidos aquí también si los usas para renderizado.
  nombre: string // Asumiendo que apiService.Objetivo tiene 'nombre'
  frecuencia?: Frecuencia // Asumiendo que apiService.Objetivo puede tener 'frecuencia'
  descripcion?: string // Asumiendo que apiService.Objetivo puede tener una segunda 'descripcion' (para UI)
}

export default function ObjetivosPage() {
  const [openDialog, setOpenDialog] = useState<"nuevo" | "editar" | "ahorro" | null>(null)
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

    // Validación según los campos que el backend espera (descripcion, meta, actual)
    // 'nombre' del frontend se mapea a 'descripcion' del backend
    if (!formData.nombre || !formData.meta || !formData.actual) {
      toast({
        title: "Error de validación",
        description: "Por favor completa el nombre, meta y monto actual del objetivo.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Prepara los datos para enviar al backend
      // Mapea 'nombre' del frontend a 'descripcion' del backend
      const dataToSave = {
        descripcion: formData.nombre, // ¡Este es el cambio clave!
        meta: Number.parseFloat(formData.meta),
        actual: Number.parseFloat(formData.actual || "0"), // Asegura que 'actual' sea un número, por defecto 0 si está vacío
        // Los campos 'frecuencia', 'descripcion' (la secundaria del formulario), 'fechaInicio', 'fechaFin'
        // NO se incluyen aquí porque el modelo ObjetivosFinancieros de Django NO los tiene.
        // Si tu backend espera estos campos, deberás revisar el modelo de Django o el tipo 'Objetivo' en api-service.ts
      };

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
    setObjetivoActual(objetivo);
    setFormData({
      nombre: objetivo.nombre, // Carga el nombre del objetivo para el campo 'nombre' del formulario
      descripcion: objetivo.descripcion || '', // Carga la descripción del objetivo (aunque no se use al guardar)
      actual: objetivo.actual.toString(),
      meta: objetivo.meta.toString(),
      frecuencia: objetivo.frecuencia || { id: 0, Tipo: '' }, // Carga la frecuencia (aunque no se use al guardar)
      fechaInicio: new Date().toISOString().split("T")[0], // Asume fecha actual o ajusta si el objetivo tiene fecha de inicio
      fechaFin: "", // Asume vacío o ajusta
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

      try {
        // Prepara los datos para enviar al backend (solo 'descripcion', 'meta', 'actual')
        const dataToUpdateForBackend = {
          descripcion: objetivoActual.nombre, // Usa el nombre actual como descripción para el backend
          meta: objetivoActual.meta,
          actual: nuevoActual,
        };

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
                    porcentaje: Math.round((updatedObjetivoBackend.actual / updatedObjetivoBackend.meta) * 100),
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
                        porcentaje: Math.round((updatedObjetivoBackend.actual / updatedObjetivoBackend.meta) * 100),
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
  const progresoData = objetivos.map((obj) => ({
    name: obj.nombre,
    actual: obj.actual,
    objetivo: obj.meta,
    porcentaje: obj.porcentaje,
  }))

  // Función para filtrar objetivos
  const filteredObjetivos = objetivos.filter(objetivo =>
    objetivo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (objetivo.descripcion && objetivo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredObjetivosCompletados = objetivosCompletados.filter(objetivo =>
    objetivo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (objetivo.descripcion && objetivo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
                {/* NOTA: El campo Descripción (adicional) no es parte del modelo 'ObjetivosFinancieros'
                            que proporcionaste en Django (el 'nombre' del frontend ya es la 'descripcion' del backend).
                            Si es necesario, el backend necesitaría un segundo campo de descripción. */}
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

      {/* Barra de búsqueda */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar objetivos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10"
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

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      )}

      {filteredObjetivos.length > 0 && !error && (
        <div className="space-y-4">
          {filteredObjetivos.map((objetivo) => (
            <Card key={objetivo.id!} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{objetivo.nombre}</h3>
                    {objetivo.descripcion && objetivo.descripcion !== objetivo.nombre && (
                      <p className="text-sm text-muted-foreground mt-1">{objetivo.descripcion}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAgregarAhorroDialog(objetivo)}
                      className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-950 bg-background"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(objetivo)}
                      className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 bg-background"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
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

      {/* Mostrar mensaje cuando no hay resultados de búsqueda */}
      {searchTerm && filteredObjetivos.length === 0 && filteredObjetivosCompletados.length === 0 && !error && (
        <Card className="p-6 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg">No se encontraron objetivos que coincidan con "{searchTerm}"</p>
          </div>
        </Card>
      )}

      {/* Mostrar mensaje cuando no hay objetivos en general */}
      {objetivos.length === 0 && objetivosCompletados.length === 0 && !searchTerm && !error && (
        <Card className="p-6 text-center">
          <div className="text-muted-foreground py-12">
            <Target className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg">No tienes objetivos financieros registrados</p>
            <p className="mb-4">Crea tu primer objetivo para comenzar a ahorrar</p>
            <Button 
              className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700" 
              onClick={() => setOpenDialog("nuevo")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Objetivo
            </Button>
          </div>
        </Card>
      )}

      {/* Objetivos completados */}
      {filteredObjetivosCompletados.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold tracking-tight mb-4">Objetivos Completados</h2>
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
                      <p className="text-sm text-muted-foreground mt-1">
                        Completado el: {objetivo.fechaCompletado ? formatDate(objetivo.fechaCompletado) : 'N/A'}
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
        </div>
      )}
    </div>
  )
}