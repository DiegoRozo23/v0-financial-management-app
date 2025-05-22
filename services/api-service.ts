import { authService } from "./auth-service"

// Constantes
const API_URL = "https://finanzasapi-c7or.onrender.com"

// Interfaces para los tipos de datos
export interface Ingreso {
  id?: number
  monto: number
  fecha: string
  descripcion: string
}

export interface Gasto {
  id?: number
  monto: number
  fecha: string
  descripcion: string
}

export interface Ahorro {
  id?: number
  monto: number
  fecha: string
  descripcion: string
  nombre: string
  fecha_Final: string
}

export interface GastoFijo {
  id?: number
  monto: number
  fecha: string
  descripcion: string
}

export interface Frecuencia {
  id: number
  nombre: string
}

export interface Objetivo {
  id?: number
  nombre: string
  meta: number
  frecuencia: Frecuencia
}

// Servicio API genérico
export const apiService = {
  // Método para realizar solicitudes autenticadas
  async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    let accessToken = authService.getAccessToken()

    // Si no hay token, intentar refrescar
    if (!accessToken) {
      accessToken = await authService.refreshToken()
      if (!accessToken) {
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
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })

      // Si el token expiró (401), intentar refrescar y reintentar
      if (response.status === 401) {
        const newToken = await authService.refreshToken()
        if (newToken) {
          // Reintentar con el nuevo token
          return this.fetchWithAuth(endpoint, options)
        } else {
          // Si no se pudo refrescar, cerrar sesión
          authService.logout()
          throw new Error("Sesión expirada")
        }
      }

      if (response.status === 204) {
        // No content - normalmente en operaciones DELETE exitosas
        return null
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error en la solicitud")
      }

      return data
    } catch (error) {
      console.error(`Error en solicitud a ${endpoint}:`, error)
      throw error
    }
  },

  // INGRESOS
  async getIngresos(): Promise<Ingreso[]> {
    return this.fetchWithAuth("/api/finanzas/ingresos/")
  },

  async createIngreso(data: Omit<Ingreso, "id">): Promise<Ingreso> {
    return this.fetchWithAuth("/api/finanzas/ingresos/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateIngreso(id: number, data: Omit<Ingreso, "id">): Promise<Ingreso> {
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

  async createGasto(data: Omit<Gasto, "id">): Promise<Gasto> {
    return this.fetchWithAuth("/api/finanzas/gastos/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateGasto(id: number, data: Omit<Gasto, "id">): Promise<Gasto> {
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

  async createAhorro(data: Omit<Ahorro, "id">): Promise<Ahorro> {
    return this.fetchWithAuth("/api/finanzas/ahorros/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateAhorro(id: number, data: Omit<Ahorro, "id">): Promise<Ahorro> {
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

  // GASTOS FIJOS
  async getGastosFijos(): Promise<GastoFijo[]> {
    return this.fetchWithAuth("/api/finanzas/gastosfijos/")
  },

  async createGastoFijo(data: Omit<GastoFijo, "id">): Promise<GastoFijo> {
    return this.fetchWithAuth("/api/finanzas/gastosfijos/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateGastoFijo(id: number, data: Omit<GastoFijo, "id">): Promise<GastoFijo> {
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

  // OBJETIVOS
  async getObjetivos(): Promise<Objetivo[]> {
    return this.fetchWithAuth("/api/finanzas/objetivo/")
  },

  async createObjetivo(data: Omit<Objetivo, "id">): Promise<Objetivo> {
    return this.fetchWithAuth("/api/finanzas/objetivo/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateObjetivo(id: number, data: Omit<Objetivo, "id">): Promise<Objetivo> {
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
}
