"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Chart } from "@/components/ui/chart"
import { apiService } from "@/services/api-service"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    console.log("🔄 Cargando datos del dashboard...")

    try {
      const data = await apiService.getDashboardData()
      console.log("✅ Datos del dashboard cargados:", data)
      setDashboardData(data)
    } catch (err) {
      console.error("❌ Error al cargar datos del dashboard:", err)
      setError(err instanceof Error ? err.message : "Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Datos para gráficos
  const getChartData = () => {
    if (!dashboardData) return { ingresos: [], gastos: [] }

    const ingresos = dashboardData.ingresos || []
    const gastos = dashboardData.gastos || []

    return {
      ingresos,
      gastos,
    }
  }

  const { ingresos, gastos } = getChartData()

  // Calcular balance
  const calcularBalance = () => {
    if (!dashboardData) return { total: 0, ingresos: 0, gastos: 0 }

    const totalIngresos = ingresos.reduce((sum: number, i: any) => sum + i.monto, 0)
    const totalGastos = gastos.reduce((sum: number, g: any) => sum + g.monto, 0)

    return {
      total: totalIngresos - totalGastos,
      ingresos: totalIngresos,
      gastos: totalGastos,
    }
  }

  const balance = calcularBalance()

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadDashboardData} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {user && <p className="text-sm text-muted-foreground">Bienvenido, {user.username}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance Total</CardTitle>
            <CardDescription>Ingresos - Gastos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(balance.total)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <CardDescription>Total de ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{formatCurrency(balance.ingresos)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <CardDescription>Total de gastos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{formatCurrency(balance.gastos)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs Gastos</CardTitle>
              <CardDescription>Comparativa de los últimos meses</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <Chart
                  type="bar"
                  data={{
                    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
                    datasets: [
                      {
                        label: "Ingresos",
                        data: [500, 600, 700, 800, 900, 1000],
                        backgroundColor: "rgba(34, 197, 94, 0.5)",
                        borderColor: "rgb(34, 197, 94)",
                        borderWidth: 1,
                      },
                      {
                        label: "Gastos",
                        data: [300, 400, 500, 600, 700, 800],
                        backgroundColor: "rgba(239, 68, 68, 0.5)",
                        borderColor: "rgb(239, 68, 68)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Transacciones</CardTitle>
                <CardDescription>Movimientos recientes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...ingresos, ...gastos]
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .slice(0, 5)
                      .map((t: any, i) => (
                        <div key={i} className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-medium">{t.concepto || t.descripcion || "Transacción"}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(t.fecha).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            className={ingresos.includes(t) ? "font-medium text-green-600" : "font-medium text-red-600"}
                          >
                            {ingresos.includes(t) ? "+" : "-"}
                            {formatCurrency(t.monto)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Objetivos</CardTitle>
                <CardDescription>Progreso de tus metas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : dashboardData?.objetivos?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.objetivos.slice(0, 3).map((objetivo: any) => {
                      const progreso = (objetivo.actual / objetivo.objetivo) * 100
                      return (
                        <div key={objetivo.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{objetivo.nombre}</div>
                            <div className="text-sm">
                              {formatCurrency(objetivo.actual)} / {formatCurrency(objetivo.objetivo)}
                            </div>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600 rounded-full"
                              style={{ width: `${Math.min(progreso, 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No hay objetivos definidos</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Gastos</CardTitle>
              <CardDescription>Por categoría</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <Chart
                  type="doughnut"
                  data={{
                    labels: ["Alimentación", "Transporte", "Ocio", "Vivienda", "Otros"],
                    datasets: [
                      {
                        data: [300, 150, 100, 350, 200],
                        backgroundColor: [
                          "rgba(34, 197, 94, 0.7)",
                          "rgba(59, 130, 246, 0.7)",
                          "rgba(249, 115, 22, 0.7)",
                          "rgba(239, 68, 68, 0.7)",
                          "rgba(168, 85, 247, 0.7)",
                        ],
                        borderColor: [
                          "rgb(34, 197, 94)",
                          "rgb(59, 130, 246)",
                          "rgb(249, 115, 22)",
                          "rgb(239, 68, 68)",
                          "rgb(168, 85, 247)",
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Panel de depuración */}
      <details className="mt-8 p-4 border rounded-md">
        <summary className="font-medium cursor-pointer">Información de depuración</summary>
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
          <pre className="whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify({ user, dashboardData, balance }, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  )
}
