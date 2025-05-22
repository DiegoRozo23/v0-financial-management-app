"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, CreditCard, DollarSign, Plus, Target, TrendingDown, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { apiService, type Ingreso, type Gasto, type Objetivo } from "@/services/api-service"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Obtener datos de múltiples endpoints en paralelo
        const [ingresosData, gastosData, objetivosData] = await Promise.all([
          apiService.getIngresos(),
          apiService.getGastos(),
          apiService.getObjetivos(),
        ])

        setIngresos(ingresosData)
        setGastos(gastosData)
        setObjetivos(objetivosData)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("No se pudieron cargar los datos del dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Calcular total de ingresos
  const totalIngresos = ingresos.reduce((sum, ingreso) => sum + ingreso.monto, 0)

  // Calcular total de gastos
  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0)

  // Calcular balance total
  const balanceTotal = totalIngresos - totalGastos

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  // Últimas 5 transacciones (combinando ingresos y gastos)
  const ultimasTransacciones = [
    ...ingresos.map((ingreso) => ({
      id: `ingreso-${ingreso.id}`,
      tipo: "ingreso" as const,
      concepto: ingreso.descripcion,
      monto: ingreso.monto,
      fecha: formatDate(ingreso.fecha),
      categoria: "Ingreso",
    })),
    ...gastos.map((gasto) => ({
      id: `gasto-${gasto.id}`,
      tipo: "gasto" as const,
      concepto: gasto.descripcion,
      monto: gasto.monto,
      fecha: formatDate(gasto.fecha),
      categoria: "Gasto",
    })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 5)

  // Objetivos formateados para mostrar
  const objetivosFormateados = objetivos
    .map((objetivo) => ({
      nombre: objetivo.nombre,
      actual: 0, // El API no proporciona este valor, se podría calcular de otra forma
      objetivo: objetivo.meta,
      porcentaje: 0, // El API no proporciona este valor, se podría calcular de otra forma
    }))
    .slice(0, 3)

  const handleNuevoIngreso = () => {
    router.push("/dashboard/ingresos-gastos?nuevo=ingreso")
  }

  const handleNuevoGasto = () => {
    router.push("/dashboard/ingresos-gastos?nuevo=gasto")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-24 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted rounded mb-2"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Bienvenido a tu panel de control financiero.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de control financiero.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleNuevoIngreso}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Ingreso
          </Button>
          <Button variant="outline" onClick={handleNuevoGasto}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ingresos-gastos">Ingresos y Gastos</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${balanceTotal.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {balanceTotal > 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                      <span className="text-green-600">Balance positivo</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                      <span className="text-red-600">Balance negativo</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <ArrowUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalIngresos.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{ingresos.length} transacciones registradas</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <ArrowDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${totalGastos.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{gastos.length} transacciones registradas</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Últimas Transacciones</CardTitle>
                <CardDescription>Tus movimientos financieros más recientes</CardDescription>
              </CardHeader>
              <CardContent>
                {ultimasTransacciones.length > 0 ? (
                  <div className="space-y-4">
                    {ultimasTransacciones.map((transaccion) => (
                      <div key={transaccion.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              transaccion.tipo === "ingreso" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {transaccion.tipo === "ingreso" ? (
                              <ArrowUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDown className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transaccion.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              {transaccion.categoria} • {transaccion.fecha}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-medium ${
                            transaccion.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaccion.tipo === "ingreso" ? "+" : "-"}${transaccion.monto.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No hay transacciones registradas</div>
                )}
                <div className="mt-4 text-center">
                  <Link href="/dashboard/ingresos-gastos">
                    <Button variant="outline" size="sm">
                      Ver todas las transacciones
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Objetivos Financieros</CardTitle>
                <CardDescription>Progreso hacia tus metas financieras</CardDescription>
              </CardHeader>
              <CardContent>
                {objetivosFormateados.length > 0 ? (
                  <div className="space-y-4">
                    {objetivosFormateados.map((objetivo, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{objetivo.nombre}</span>
                          </div>
                          <span className="text-sm">
                            ${objetivo.actual.toLocaleString()} / ${objetivo.objetivo.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={objetivo.porcentaje} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No hay objetivos registrados</div>
                )}
                <div className="mt-4 text-center">
                  <Link href="/dashboard/objetivos">
                    <Button variant="outline" size="sm">
                      Ver todos los objetivos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="ingresos-gastos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Categoría</CardTitle>
                <CardDescription>Distribución de tus fuentes de ingresos</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-2" />
                  <p>No hay suficientes datos para mostrar gráficos</p>
                  <Link href="/dashboard/ingresos-gastos">
                    <Button variant="outline" size="sm" className="mt-4">
                      Ir a Ingresos y Gastos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
                <CardDescription>Distribución de tus gastos por categoría</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <CreditCard className="mx-auto h-12 w-12 mb-2" />
                  <p>No hay suficientes datos para mostrar gráficos</p>
                  <Link href="/dashboard/ingresos-gastos">
                    <Button variant="outline" size="sm" className="mt-4">
                      Ir a Ingresos y Gastos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="objetivos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {objetivosFormateados.length > 0 ? (
              objetivosFormateados.map((objetivo, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{objetivo.nombre}</CardTitle>
                    <CardDescription>
                      ${objetivo.actual.toLocaleString()} de ${objetivo.objetivo.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={objetivo.porcentaje} className="h-2" />
                      <div className="text-sm text-muted-foreground">{objetivo.porcentaje}% completado</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-6 text-center">
                  <div className="text-muted-foreground">
                    <Target className="mx-auto h-12 w-12 mb-2" />
                    <p>No tienes objetivos financieros registrados</p>
                    <Link href="/dashboard/objetivos">
                      <Button variant="outline" size="sm" className="mt-4">
                        Crear un objetivo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="flex flex-col items-center justify-center p-6 border-dashed">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium mb-2">Crear nuevo objetivo</h3>
                <p className="text-sm text-muted-foreground mb-4">Establece una nueva meta financiera para ahorrar</p>
                <Link href="/dashboard/objetivos">
                  <Button>Crear Objetivo</Button>
                </Link>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
