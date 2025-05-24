"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"
import { apiService, Ingreso, Gasto, Objetivo, GastoFijo, Ahorro } from "@/services/api-service"
import { authService } from "@/services/auth-service"

// Interfaces para los datos procesados
interface DatoGrafico {
  name: string
  value: number
}

interface DatoObjetivo {
  name: string
  actual: number
  objetivo: number
  porcentaje: number
}

interface DatoEvolucion {
  name: string
  ingresos: number
  gastos: number
  ahorros: number
  balance: number
}

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("mayo2025")
  const [periodoMeses, setPeriodoMeses] = useState<6 | 12>(6)
  const [activeTab, setActiveTab] = useState("general")
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([])
  const [ahorros, setAhorros] = useState<Ahorro[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Verificar autenticación
        const accessToken = authService.getAccessToken()
        if (!accessToken) {
          const newToken = await authService.refreshToken()
          if (!newToken) {
            setError("No estás autenticado. Por favor, inicia sesión nuevamente.")
            return
          }
        }

        console.log("Iniciando carga de datos...")
        
        const [ingresosData, gastosData, objetivosData, gastosFijosData, ahorrosData] = await Promise.all([
          apiService.getIngresos(),
          apiService.getGastos(),
          apiService.getObjetivos(),
          apiService.getGastosFijos(),
          apiService.getAhorros(),
        ])

        console.log("Datos cargados:", {
          ingresos: ingresosData,
          gastos: gastosData,
          objetivos: objetivosData,
          gastosFijos: gastosFijosData,
          ahorros: ahorrosData
        })

        if (!Array.isArray(ingresosData) || !Array.isArray(gastosData)) {
          throw new Error("Los datos recibidos no tienen el formato esperado")
        }

        setIngresos(ingresosData)
        setGastos(gastosData)
        setObjetivos(objetivosData)
        setGastosFijos(gastosFijosData)
        setAhorros(ahorrosData)

        // Verificar procesamiento de datos
        const ingresosAgrupados = ingresosData.reduce((acc, curr) => {
          const descripcion = curr.descripcion || 'Sin descripción'
          acc[descripcion] = (acc[descripcion] || 0) + curr.cantidad
          return acc
        }, {} as Record<string, number>)

        const gastosAgrupados = gastosData.reduce((acc, curr) => {
          const descripcion = curr.descripcion || 'Sin descripción'
          acc[descripcion] = (acc[descripcion] || 0) + curr.cantidad
          return acc
        }, {} as Record<string, number>)

        console.log("Datos procesados:", {
          ingresosAgrupados,
          gastosAgrupados
        })

      } catch (err) {
        console.error("Error detallado al cargar los datos:", err)
        setError(err instanceof Error ? err.message : "Error al cargar los datos. Por favor, intenta recargar la página.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [periodo])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          Cargando datos...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="text-lg text-red-500">{error}</div>
        <Button onClick={() => window.location.reload()}>Recargar página</Button>
      </div>
    )
  }

  if (!ingresos.length && !gastos.length && !objetivos.length) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-lg text-muted-foreground">No hay datos disponibles para mostrar</div>
      </div>
    )
  }

  // Procesamiento de datos para gráficos
  const datosIngresos = ingresos
    .filter(item => item && typeof item.cantidad === 'number' && item.descripcion)
    .map((item) => ({
    name: item.descripcion,
      value: item.cantidad,
    }))

  const datosGastos = gastos
    .filter(item => item && typeof item.cantidad === 'number' && item.descripcion)
    .map((item) => ({
      name: item.descripcion,
      value: item.cantidad,
    }))

  const datosGastosFijos = gastosFijos
    .filter(item => item && typeof item.cantidad === 'number' && item.descripcion)
    .map((item) => ({
    name: item.descripcion,
      value: item.cantidad,
    }))

  const datosAhorros = ahorros
    .filter(item => item && typeof item.cantidad === 'number' && (item.nombre || item.descripcion))
    .map((item) => ({
      name: item.nombre || item.descripcion,
      value: item.cantidad,
    }))

  const totalIngresos = ingresos
    .filter(item => item && typeof item.cantidad === 'number')
    .reduce((sum, item) => sum + item.cantidad, 0)

  const totalGastos = gastos
    .filter(item => item && typeof item.cantidad === 'number')
    .reduce((sum, item) => sum + item.cantidad, 0)

  const totalAhorros = ahorros
    .filter(item => item && typeof item.cantidad === 'number')
    .reduce((sum, item) => sum + item.cantidad, 0)

  const totalGastosFijos = gastosFijos
    .filter(item => item && typeof item.cantidad === 'number')
    .reduce((sum, item) => sum + item.cantidad, 0)

  // Procesamiento de datos para ingresos y gastos
  const datosIngresosFinal = ingresos
    .filter(ingreso => ingreso && typeof ingreso.cantidad === 'number' && ingreso.descripcion)
    .map(ingreso => ({
      name: ingreso.descripcion,
      value: ingreso.cantidad
    }))
    .reduce((acc, curr) => {
      const existingItem = acc.find(item => item.name === curr.name)
      if (existingItem) {
        existingItem.value += curr.value
      } else {
        acc.push(curr)
      }
      return acc
    }, [] as { name: string; value: number }[])
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const datosGastosFinal = gastos
    .filter(gasto => gasto && typeof gasto.cantidad === 'number' && gasto.descripcion)
    .map(gasto => ({
      name: gasto.descripcion,
      value: gasto.cantidad
    }))
    .reduce((acc, curr) => {
      const existingItem = acc.find(item => item.name === curr.name)
      if (existingItem) {
        existingItem.value += curr.value
      } else {
        acc.push(curr)
      }
      return acc
    }, [] as { name: string; value: number }[])
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  console.log("Datos procesados:", {
    ingresos: datosIngresosFinal,
    gastos: datosGastosFinal
  })

  // Procesamiento de datos para el resumen financiero
  const balanceTotal = totalIngresos - totalGastos
  const datosResumen: DatoGrafico[] = [
    { name: "Ingresos Totales", value: totalIngresos },
    { name: "Gastos Totales", value: totalGastos },
    { name: "Balance", value: Math.abs(balanceTotal) },
    { name: "Gastos Fijos", value: totalGastosFijos },
    { name: "Ahorros", value: totalAhorros },
  ].filter(item => typeof item.value === 'number' && item.value > 0)
    .sort((a, b) => b.value - a.value)

  console.log("Datos del resumen financiero:", {
    totalIngresos,
    totalGastos,
    balanceTotal,
    totalGastosFijos,
    totalAhorros,
    datosResumen
  })

  // Categorización mejorada de ingresos
  const categorizarIngresos = (ingresos: Ingreso[]) => {
    const categorias = {
      "Salario": ["salario", "sueldo", "nomina", "pago mensual"],
      "Freelance": ["freelance", "proyecto", "consultoría", "honorarios"],
      "Inversiones": ["inversión", "dividendo", "interés", "renta"],
      "Otros": ["otros", "extra", "adicional"]
    }

    return ingresos.reduce((acc, ingreso) => {
      const descripcionLower = ingreso.descripcion.toLowerCase()
      let categoriaEncontrada = "Otros"

      for (const [categoria, palabrasClave] of Object.entries(categorias)) {
        if (palabrasClave.some(palabra => descripcionLower.includes(palabra))) {
          categoriaEncontrada = categoria
          break
        }
      }

      acc[categoriaEncontrada] = (acc[categoriaEncontrada] || 0) + ingreso.cantidad
      return acc
    }, {} as Record<string, number>)
  }

  // Categorización mejorada de gastos
  const categorizarGastos = (gastos: Gasto[]) => {
    const categorias = {
      "Alimentación": ["comida", "mercado", "supermercado", "alimentos"],
      "Transporte": ["gasolina", "transporte", "uber", "taxi", "bus"],
      "Servicios": ["luz", "agua", "gas", "internet", "teléfono"],
      "Entretenimiento": ["cine", "restaurante", "viaje", "ocio"],
      "Salud": ["medicina", "doctor", "farmacia", "médico"],
      "Educación": ["curso", "estudio", "libro", "universidad"],
      "Otros": ["otros", "varios", "misc"]
    }

    return gastos.reduce((acc, gasto) => {
      const descripcionLower = gasto.descripcion.toLowerCase()
      let categoriaEncontrada = "Otros"

      for (const [categoria, palabrasClave] of Object.entries(categorias)) {
        if (palabrasClave.some(palabra => descripcionLower.includes(palabra))) {
          categoriaEncontrada = categoria
          break
        }
      }

      acc[categoriaEncontrada] = (acc[categoriaEncontrada] || 0) + gasto.cantidad
      return acc
    }, {} as Record<string, number>)
  }

  const datosIngresosPorCategoria = Object.entries(categorizarIngresos(ingresos))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const datosGastosPorCategoria = Object.entries(categorizarGastos(gastos))
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Top 5 de ingresos y gastos
  const topIngresos = ingresos
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
    .map(ingreso => ({
      name: ingreso.descripcion || 'Sin descripción',
      value: ingreso.cantidad
    }))

  const topGastos = gastos
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
    .map(gasto => ({
      name: gasto.descripcion || 'Sin descripción',
      value: gasto.cantidad
    }))

  // Generar datos de evolución mensual
  const generarDatosEvolucion = () => {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const fechaActual = new Date()
    const datosEvolucion: DatoEvolucion[] = []

    for (let i = periodoMeses - 1; i >= 0; i--) {
      const fecha = new Date(fechaActual)
      fecha.setMonth(fechaActual.getMonth() - i)
      const mesIndex = fecha.getMonth()
      const año = fecha.getFullYear()

      const ingresosDelMes = ingresos
        .filter(ingreso => {
          const fechaIngreso = new Date(ingreso.fecha)
          return fechaIngreso.getMonth() === mesIndex && fechaIngreso.getFullYear() === año
        })
        .reduce((sum, ingreso) => sum + ingreso.cantidad, 0)

      const gastosDelMes = gastos
        .filter(gasto => {
          const fechaGasto = new Date(gasto.fecha)
          return fechaGasto.getMonth() === mesIndex && fechaGasto.getFullYear() === año
        })
        .reduce((sum, gasto) => sum + gasto.cantidad, 0)

      const ahorrosDelMes = ahorros
        .filter(ahorro => {
          const fechaAhorro = new Date(ahorro.fecha)
          return fechaAhorro.getMonth() === mesIndex && fechaAhorro.getFullYear() === año
        })
        .reduce((sum, ahorro) => sum + ahorro.cantidad, 0)

      datosEvolucion.push({
        name: `${meses[mesIndex]} ${año}`,
        ingresos: ingresosDelMes || 0,
        gastos: gastosDelMes || 0,
        ahorros: ahorrosDelMes || 0,
        balance: ingresosDelMes - gastosDelMes,
      })
    }

    return datosEvolucion
  }

  const datosEvolucion = generarDatosEvolucion()

  const datosObjetivos: DatoObjetivo[] = objetivos
    .filter(item => item && typeof item.actual === 'number' && typeof item.meta === 'number' && item.descripcion)
    .map((item) => ({
      name: item.descripcion,
    actual: item.actual,
    objetivo: item.meta,
    porcentaje: (item.actual / item.meta) * 100,
  }))

  // Colores personalizados más atractivos
  const COLORS = [
    "#3B82F6", // Azul
    "#EF4444", // Rojo
    "#10B981", // Verde
    "#F59E0B", // Ámbar
    "#8B5CF6", // Púrpura
    "#06B6D4", // Cyan
    "#EC4899", // Rosa
    "#6366F1", // Índigo
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Visualiza y analiza tus finanzas personales.</p>
        </div>

      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ingresos-gastos">Ingresos y Gastos</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
                <CardDescription>Balance general de tus finanzas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-3 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                          data={datosResumen}
                      cx="50%"
                      cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                      fill="#8884d8"
                      dataKey="value"
                          nameKey="name"
                          onMouseEnter={(data, index) => {
                            const element = document.getElementById(`resumen-item-${index}`)
                            if (element) {
                              element.classList.add('scale-105', 'bg-accent')
                              element.style.transition = 'all 0.3s ease'
                            }
                          }}
                          onMouseLeave={(data, index) => {
                            const element = document.getElementById(`resumen-item-${index}`)
                            if (element) {
                              element.classList.remove('scale-105', 'bg-accent')
                            }
                          }}
                          animationBegin={0}
                          animationDuration={266}
                        >
                          {datosResumen.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                              className="transition-all duration-300 ease-in-out hover:opacity-80"
                            />
                      ))}
                    </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border rounded-lg p-3 shadow-lg">
                                  <p className="text-sm font-medium">{data.name}</p>
                                  <p className="text-lg font-bold">
                                    ${data.value.toLocaleString()}
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                  </RechartsPieChart>
                </ResponsiveContainer>
                  </div>
                  <div className="col-span-2 space-y-4 p-4 bg-card rounded-lg border">
                    {datosResumen.map((entry, index) => (
                      <div 
                        id={`resumen-item-${index}`}
                        key={entry.name} 
                        className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-accent cursor-pointer"
                        onMouseEnter={() => {
                          const paths = document.querySelectorAll('.recharts-pie-sector') as NodeListOf<HTMLElement>
                          if (paths[index]) {
                            paths[index].style.opacity = '0.8'
                            paths[index].style.transform = 'scale(1.05)'
                            paths[index].style.transition = 'all 0.3s ease'
                          }
                        }}
                        onMouseLeave={() => {
                          const paths = document.querySelectorAll('.recharts-pie-sector') as NodeListOf<HTMLElement>
                          if (paths[index]) {
                            paths[index].style.opacity = '1'
                            paths[index].style.transform = 'scale(1)'
                          }
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
                          <span className="text-lg font-bold">
                            ${entry.value.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolución Mensual</CardTitle>
                <CardDescription>Tendencia de ingresos, gastos y ahorros</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={periodoMeses === 6 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriodoMeses(6)}
                  >
                    6 meses
                  </Button>
                  <Button
                    variant={periodoMeses === 12 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPeriodoMeses(12)}
                  >
                    1 año
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="relative min-h-[500px] w-full">
                <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={datosEvolucion}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        domain={['auto', 'auto']}
                        yAxisId="left"
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        orientation="right"
                        yAxisId="right"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center gap-2 mb-1">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm font-medium">{entry.name}:</span>
                                    <span className="text-sm font-bold">
                                      ${entry.value?.toLocaleString() ?? '0'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                          return null
                        }}
                        wrapperStyle={{ zIndex: 1000 }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36}
                        wrapperStyle={{ paddingBottom: '20px' }}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, marginRight: '10px' }}>{value}</span>
                        )}
                      />
                      <Line
                        yAxisId="left"
                      type="monotone"
                      dataKey="ingresos"
                        stroke={COLORS[0]}
                        strokeWidth={3}
                        dot={{ r: 6, fill: COLORS[0] }}
                        activeDot={{ r: 8, className: "animate-pulse" }}
                      name="Ingresos"
                        animationBegin={0}
                        animationDuration={266}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="gastos"
                        stroke={COLORS[1]}
                        strokeWidth={3}
                        dot={{ r: 6, fill: COLORS[1] }}
                        activeDot={{ r: 8, className: "animate-pulse" }}
                        name="Gastos"
                        animationBegin={200}
                        animationDuration={266}
                      />
                      <Line
                        yAxisId="right"
                      type="monotone"
                      dataKey="balance"
                        stroke={COLORS[2]}
                        strokeWidth={3}
                        dot={{ r: 6, fill: COLORS[2] }}
                        activeDot={{ r: 8, className: "animate-pulse" }}
                      name="Balance"
                        animationBegin={400}
                        animationDuration={266}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="ahorros"
                        stroke={COLORS[3]}
                        strokeWidth={3}
                        dot={{ r: 6, fill: COLORS[3] }}
                        activeDot={{ r: 8, className: "animate-pulse" }}
                        name="Ahorros"
                        animationBegin={600}
                        animationDuration={266}
                      />
                    </RechartsLineChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gastos Fijos vs Variables</CardTitle>
                <CardDescription>Comparación de tipos de gastos</CardDescription>
              </CardHeader>
              <CardContent className="relative min-h-[400px] w-full">
                <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Gastos Fijos", value: totalGastosFijos },
                        { name: "Gastos Variables", value: totalGastos },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Monto">
                        {[0, 1].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ingresos-gastos" className="space-y-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Mayores Ingresos</CardTitle>
                <CardDescription>Tus ingresos más significativos</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topIngresos}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={90}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium">{data.name}</p>
                              <p className="text-lg font-bold">
                                ${data.value?.toLocaleString() || '0'}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar 
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={266}
                    >
                      {topIngresos.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-300 ease-in-out hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Mayores Gastos</CardTitle>
                <CardDescription>Tus gastos más significativos</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px] w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topGastos}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={90}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(200, 200, 200, 0.2)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-medium">{data.name}</p>
                              <p className="text-lg font-bold">
                                ${data.value?.toLocaleString() || '0'}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar 
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={266}
                    >
                      {topGastos.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[(index + 3) % COLORS.length]}
                          className="transition-all duration-300 ease-in-out hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}