import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, DollarSign, LineChart, PiggyBank, Target } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <DollarSign className="h-6 w-6" />
          <span>FinanzApp</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#caracteristicas" className="text-sm font-medium hover:underline underline-offset-4">
            Características
          </Link>
          <Link href="#acerca" className="text-sm font-medium hover:underline underline-offset-4">
            Acerca de
          </Link>
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Iniciar Sesión
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col justify-center items-center text-center space-y-4 max-w-3xl mx-auto">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Gestiona tus finanzas personales
                </h1>
                <p className="text-gray-500 md:text-xl dark:text-gray-400">
                  Controla tus ingresos, gastos, inversiones y establece objetivos financieros de manera sencilla e
                  intuitiva.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/registro">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700">
                    Comenzar Gratis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="caracteristicas" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Características Principales</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Todo lo que necesitas para gestionar tus finanzas en un solo lugar
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4 rounded-lg border p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Ingresos y Gastos</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Registra y visualiza todos tus ingresos y gastos de manera organizada y categorizada.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-lg border p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Inversiones</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Realiza un seguimiento de tus inversiones y visualiza su evolución a lo largo del tiempo.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-lg border p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Objetivos Financieros</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Establece metas financieras y visualiza tu progreso para alcanzarlas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="acerca" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Acerca de FinanzApp</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                    FinanzApp es una aplicación diseñada para ayudarte a tomar el control de tus finanzas personales. 
                    Con herramientas intuitivas y funciones avanzadas, podrás gestionar tu dinero de manera eficiente 
                    y alcanzar tus metas financieras.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <PiggyBank className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 FinanzApp. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
