import { authService } from "./auth-service"

// Constantes
const API_URL = "https://finanzasapi-c7or.onrender.com"

// Función para mostrar logs en consola con formato
const logRequest = (title: string, data: any) => {
  console.group(`🌐 ${title}`)
  console.log(data)
  console.groupEnd()
}

// Tipos para las entidades principales
export interface Ingreso {
  id?: number
  concepto: string
  monto: number
  fecha: string
  categoria: string
}

export interface Gasto {
  id?: number
  concepto: string
  monto: number
  fecha: string
  categoria: string
}

export interface Ahorro {
  id?: number
  nombre: string
  tipo: string
  monto: number
  fecha: string
  descripcion?: string
}

export interface Objetivo {
  id?: number
  nombre: string
  descripcion: string
  actual: number
  objetivo: number
  fechaInicio: string
  fechaFin: string
  completado?: boolean
}

export interface GastoFijo {
  id?: number
  concepto: string
  monto: number
  frecuencia: number
  categoria: string
}

export interface Frecuencia {
  id: number
  nombre: string
}

export interface Categoria {
  id: number
  nombre: string
  tipo: string
}

// Servicio API genérico
export const apiService = {
  // Método para realizar solicitudes autenticadas
  async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const requestId = Math.random().toString(36).substring(7)

    logRequest(`SOLICITUD #${requestId} - ${options.method || "GET"} ${endpoint}`, {
      url: `${API_URL}${endpoint}`,
      method: options.method || "GET",
      body: options.body ? JSON.parse(options.body.toString()) : undefined,
      headers: options.headers,
    })

    let accessToken = authService.getAccessToken()

    // Si no hay token, intentar refrescar
    if (!accessToken) {
      console.log(`❌ SOLICITUD #${requestId} - No hay token de acceso`)
      accessToken = await authService.refreshToken()
      if (!accessToken) {
        console.log(`❌ SOLICITUD #${requestId} - No se pudo obtener un token válido`)
        throw new Error("No autenticado")
      }
    }

    // Configurar headers con el token
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    }

    try {
      console.log(`🔄 SOLICITUD #${requestId} - Enviando solicitud...`)

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      // Intentar obtener el cuerpo de la respuesta
      let responseBody
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        responseBody = await response.json()
      } else {
        responseBody = await response.text()
      }

      logRequest(`RESPUESTA #${requestId} - ${response.status} ${response.statusText}`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      })

      // Si el token expiró (401), intentar refrescar y reintentar
      if (response.status === 401) {
        console.log(`🔄 SOLICITUD #${requestId} - Token expirado, intentando refrescar...`)
        const newToken = await authService.refreshToken()
        if (newToken) {
          console.log(`✅ SOLICITUD #${requestId} - Token refrescado, reintentando...`)
          // Reintentar con el nuevo token
          return this.fetchWithAuth(endpoint, options)
        } else {
          // Si no se pudo refrescar, cerrar sesión
          console.log(`❌ SOLICITUD #${requestId} - No se pudo refrescar el token`)
          authService.logout()
          throw new Error("Sesión expirada")
        }
      }

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        console.log(`❌ SOLICITUD #${requestId} - Error en la respuesta: ${response.status} ${response.statusText}`)
        throw new Error(
          typeof responseBody === "object" && responseBody.detail
            ? responseBody.detail
            : `Error ${response.status}: ${response.statusText}`,
        )
      }

      console.log(`✅ SOLICITUD #${requestId} - Respuesta exitosa`)
      return responseBody
    } catch (error) {
      console.error(`❌ SOLICITUD #${requestId} - Error:`, error)
      throw error
    }
  },

  // INGRESOS
  async getIngresos(): Promise<Ingreso[]> {
    return this.fetchWithAuth("/api/finanzas/ingresos/")
  },

  async getIngreso(id: number): Promise<Ingreso> {
    return this.fetchWithAuth(`/api/finanzas/ingresos/${id}/`)
  },

  async createIngreso(data: Ingreso): Promise<Ingreso> {
    return this.fetchWithAuth("/api/finanzas/ingresos/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateIngreso(id: number, data: Ingreso): Promise<Ingreso> {
    return this.fetchWithAuth(`/api/finanzas/ingresos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteIngreso(id: number): Promise<void> {
    return this.fetchWithAuth(`/api/finanzas/ingresos/${id}/`, {
      method: "DELETE",
    })
  },

  // GASTOS
  async getGastos(): Promise<Gasto[]> {
    return this.fetchWithAuth("/api/finanzas/gastos/")
  },

  async getGasto(id: number): Promise<Gasto> {
    return this.fetchWithAuth(`/api/finanzas/gastos/${id}/`)
  },

  async createGasto(data: Gasto): Promise<Gasto> {
    return this.fetchWithAuth("/api/finanzas/gastos/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateGasto(id: number, data: Gasto): Promise<Gasto> {
    return this.fetchWithAuth(`/api/finanzas/gastos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteGasto(id: number): Promise<void> {
    return this.fetchWithAuth(`/api/finanzas/gastos/${id}/`, {
      method: "DELETE",
    })
  },

  // AHORROS
  async getAhorros(): Promise<Ahorro[]> {
    return this.fetchWithAuth("/api/finanzas/ahorros/")
  },

  async getAhorro(id: number): Promise<Ahorro> {
    return this.fetchWithAuth(`/api/finanzas/ahorros/${id}/`)
  },

  async createAhorro(data: Ahorro): Promise<Ahorro> {
    return this.fetchWithAuth("/api/finanzas/ahorros/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateAhorro(id: number, data: Ahorro): Promise<Ahorro> {
    return this.fetchWithAuth(`/api/finanzas/ahorros/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteAhorro(id: number): Promise<void> {
    return this.fetchWithAuth(`/api/finanzas/ahorros/${id}/`, {
      method: "DELETE",
    })
  },

  // OBJETIVOS
  async getObjetivos(): Promise<Objetivo[]> {
    return this.fetchWithAuth("/api/finanzas/objetivo/")
  },

  async getObjetivo(id: number): Promise<Objetivo> {
    return this.fetchWithAuth(`/api/finanzas/objetivo/${id}/`)
  },

  async createObjetivo(data: Objetivo): Promise<Objetivo> {
    return this.fetchWithAuth("/api/finanzas/objetivo/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateObjetivo(id: number, data: Objetivo): Promise<Objetivo> {
    return this.fetchWithAuth(`/api/finanzas/objetivo/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteObjetivo(id: number): Promise<void> {
    return this.fetchWithAuth(`/api/finanzas/objetivo/${id}/`, {
      method: "DELETE",
    })
  },

  // GASTOS FIJOS
  async getGastosFijos(): Promise<GastoFijo[]> {
    return this.fetchWithAuth("/api/finanzas/gastosfijos/")
  },

  async getGastoFijo(id: number): Promise<GastoFijo> {
    return this.fetchWithAuth(`/api/finanzas/gastosfijos/${id}/`)
  },

  async createGastoFijo(data: GastoFijo): Promise<GastoFijo> {
    return this.fetchWithAuth("/api/finanzas/gastosfijos/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateGastoFijo(id: number, data: GastoFijo): Promise<GastoFijo> {
    return this.fetchWithAuth(`/api/finanzas/gastosfijos/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async deleteGastoFijo(id: number): Promise<void> {
    return this.fetchWithAuth(`/api/finanzas/gastosfijos/${id}/`, {
      method: "DELETE",
    })
  },

  // FRECUENCIAS
  async getFrecuencias(): Promise<Frecuencia[]> {
    return this.fetchWithAuth("/api/finanzas/frecuencia/")
  },

  // CATEGORÍAS
  async getCategorias(): Promise<Categoria[]> {
    return this.fetchWithAuth("/api/finanzas/categoria/")
  },

  // DASHBOARD
  async getDashboardData(): Promise<any> {
    try {
      const [ingresos, gastos, ahorros, objetivos] = await Promise.all([
        this.getIngresos(),
        this.getGastos(),
        this.getAhorros(),
        this.getObjetivos(),
      ])

      return {
        ingresos,
        gastos,
        ahorros,
        objetivos,
        balance: {
          ingresos: ingresos.reduce((sum, i) => sum + i.monto, 0),
          gastos: gastos.reduce((sum, g) => sum + g.monto, 0),
        },
      }
    } catch (error) {
      console.error("Error al obtener datos del dashboard:", error)
      throw error
    }
  },
}
