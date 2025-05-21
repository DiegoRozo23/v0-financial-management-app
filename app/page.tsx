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
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Gestiona tus finanzas personales
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
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
              <div className="flex items-center justify-center">
                <img
                  alt="Dashboard de finanzas"
                  className="aspect-video overflow-hidden rounded-xl object-cover object-center"
                  src="/placeholder.svg?height=550&width=800"
                />
              </div>
            </div>
          </div>
        </section>
        <section id="caracteristicas" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
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
        <section id="acerca" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Acerca del Proyecto</h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                    Este proyecto fue desarrollado por estudiantes de la Universidad de Cundinamarca como parte del
                    curso de Gestión de Proyectos centrada en los datos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Equipo de Desarrollo</h3>
                  <ul className="list-disc list-inside text-gray-500 dark:text-gray-400">
                    <li>Diego Alejandro Rozo</li>
                    <li>Orlando Contreras Suarez</li>
                    <li>Juan David Suarez Moreno</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex flex-col space-y-4 rounded-lg border p-6 shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <PiggyBank className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Tecnologías Utilizadas</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Este proyecto utiliza tecnologías modernas para ofrecer una experiencia de usuario óptima:
                    </p>
                    <ul className="list-disc list-inside text-gray-500 dark:text-gray-400">
                      <li>Frontend: React</li>
                      <li>Backend: Laravel y MySQL</li>
                      <li>Control de versiones: Git y GitHub</li>
                      <li>Deploy: Render</li>
                      <li>Diseño: Figma para prototipos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 Universidad De Cundinamarca-Sede Chía. Todos los derechos reservados.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Términos de Servicio
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacidad
          </Link>
        </nav>
      </footer>
    </div>
  )
}
