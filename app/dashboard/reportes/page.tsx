"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Download } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { exportAsCSV, exportAsExcel, exportAsPDF } from "@/utils/export-utils"

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState("mayo2025")
  const [activeTab, setActiveTab] = useState("general")
  const [exportLoading, setExportLoading] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)

  // Datos de ejemplo para los gráficos
  const datosIngresos = [
    { name: "Trabajo", value: 8000 },
    { name: "Freelance", value: 2000 },
    { name: "Otros", value: 200 },
  ]

  const datosGastos = [
    { name: "Alimentación", value: 800 },
    { name: "Vivienda", value: 1200 },
    { name: "Transporte", value: 200 },
    { name: "Entretenimiento", value: 300 },
    { name: "Servicios", value: 200 },
    { name: "Compras", value: 300 },
    { name: "Salud", value: 150 },
    { name: "Otros", value: 100 },
  ]

  const datosEvolucion = [
    { name: "Ene", ingresos: 9500, gastos: 3000, balance: 6500 },
    { name: "Feb", ingresos: 9800, gastos: 3200, balance: 6600 },
    { name: "Mar", ingresos: 9700, gastos: 3100, balance: 6600 },
    { name: "Abr", ingresos: 10200, gastos: 3300, balance: 6900 },
    { name: "May", ingresos: 10700, gastos: 3250, balance: 7450 },
  ]

  const datosObjetivos = [
    { name: "Fondo de emergencia", actual: 5000, objetivo: 10000, porcentaje: 50 },
    { name: "Vacaciones", actual: 2500, objetivo: 5000, porcentaje: 50 },
    { name: "Nuevo auto", actual: 3000, objetivo: 15000, porcentaje: 20 },
    { name: "Maestría", actual: 8000, objetivo: 20000, porcentaje: 40 },
    { name: "Renovación de casa", actual: 1500, objetivo: 7500, porcentaje: 20 },
  ]

  const datosProyeccion = [
    { name: "Jun", proyeccion: 7600 },
    { name: "Jul", proyeccion: 7800 },
    { name: "Ago", proyeccion: 8000 },
    { name: "Sep", proyeccion: 8200 },
    { name: "Oct", proyeccion: 8400 },
    { name: "Nov", proyeccion: 8600 },
    { name: "Dic", proyeccion: 8800 },
  ]

  // Colores para los gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    setExportLoading(true)

    setTimeout(() => {
      // Determine which data to export based on active tab
      let dataToExport
      const fileName = `reporte_${activeTab}_${periodo}`
      const title = `Reporte de ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`

      switch (activeTab) {
        case "general":
          dataToExport = datosEvolucion
          break
        case "ingresos-gastos":
          dataToExport = [
            ...datosIngresos.map((d) => ({ ...d, tipo: "Ingreso" })),
            ...datosGastos.map((d) => ({ ...d, tipo: "Gasto" })),
          ]
          break
        case "objetivos":
          dataToExport = datosObjetivos
          break
        default:
          dataToExport = datosEvolucion
      }

      switch (format) {
        case "excel":
          exportAsExcel(dataToExport, fileName)
          break
        case "pdf":
          exportAsPDF(dataToExport, fileName, title)
          break
        case "csv":
          exportAsCSV(dataToExport, fileName)
          break
      }

      setExportLoading(false)
      toast({
        title: "Exportación completada",
        description: `Tus reportes han sido exportados en formato ${format.toUpperCase()}.`,
      })
      setShowExportOptions(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Visualiza y analiza tus finanzas personales.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecciona período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mayo2025">Mayo 2025</SelectItem>
                <SelectItem value="abril2025">Abril 2025</SelectItem>
                <SelectItem value="marzo2025">Marzo 2025</SelectItem>
                <SelectItem value="q22025">Q2 2025</SelectItem>
                <SelectItem value="q12025">Q1 2025</SelectItem>
                <SelectItem value="2025">Año 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ingresos-gastos">Ingresos y Gastos</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
                <CardDescription>Balance general de tus finanzas</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Ingresos", value: 10700 },
                        { name: "Gastos", value: 3250 },
                        { name: "Ahorros", value: 20000 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: "Ingresos", value: 10700 },
                        { name: "Gastos", value: 3250 },
                        { name: "Ahorros", value: 20000 },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Evolución Mensual</CardTitle>
                <CardDescription>Tendencia de tus finanzas en el tiempo</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={datosEvolucion}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Ingresos"
                    />
                    <Area type="monotone" dataKey="gastos" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Gastos" />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stackId="2"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="Balance"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Gastos</CardTitle>
                <CardDescription>Desglose de gastos por categoría</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={datosGastos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {datosGastos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Análisis Comparativo</CardTitle>
              <CardDescription>Comparación con períodos anteriores</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Ene", ingresos: 9500, gastos: 3000, balance: 6500 },
                    { name: "Feb", ingresos: 9800, gastos: 3200, balance: 6600 },
                    { name: "Mar", ingresos: 9700, gastos: 3100, balance: 6600 },
                    { name: "Abr", ingresos: 10200, gastos: 3300, balance: 6900 },
                    { name: "May", ingresos: 10700, gastos: 3250, balance: 7450 },
                  ]}
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
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#8884d8" />
                  <Bar dataKey="gastos" name="Gastos" fill="#82ca9d" />
                  <Bar dataKey="balance" name="Balance" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ingresos-gastos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Categoría</CardTitle>
                <CardDescription>Distribución de tus fuentes de ingresos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={datosIngresos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {datosIngresos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
                <CardDescription>Distribución de tus gastos por categoría</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={datosGastos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {datosGastos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ingresos y Gastos</CardTitle>
              <CardDescription>Tendencia mensual de ingresos y gastos</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={datosEvolucion}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                  <Legend />
                  <Line type="monotone" dataKey="ingresos" stroke="#8884d8" activeDot={{ r: 8 }} name="Ingresos" />
                  <Line type="monotone" dataKey="gastos" stroke="#82ca9d" name="Gastos" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="objetivos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Objetivos</CardTitle>
                <CardDescription>Estado actual de tus objetivos financieros</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={datosObjetivos}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, undefined]} />
                    <Legend />
                    <Bar dataKey="actual" name="Ahorrado" stackId="a" fill="#82ca9d" />
                    <Bar
                      dataKey="objetivo"
                      name="Meta"
                      stackId="a"
                      fill="#8884d8"
                      radius={[10, 10, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Proyección de Objetivos</CardTitle>
                <CardDescription>Estimación de cumplimiento de objetivos</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={datosProyeccion}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Proyección"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="proyeccion"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Proyección de Ahorros"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
