import { authService } from "./auth-service"

// Constantes
const API_URL = "https://finanzasapi-c7or.onrender.com"

// Interfaces para los tipos de datos
export interface Ingreso {
  id?: number
  cantidad: number
  fecha: string
  descripcion: string
}

export interface Gasto {
  id?: number
  cantidad: number
  fecha: string
  descripcion: string
}

export interface Ahorro {
  id?: number
  cantidad: number
  fecha: string
  descripcion: string
  nombre: string
  fecha_Final: string
}

export interface GastoFijo {
  id?: number
  cantidad: number
  fecha: string
  descripcion: string
  frecuencia: number // ID de la frecuencia
}

export interface Frecuencia {
  id: number
  Tipo: string
}

export interface Objetivo {
  id?: number
  nombre: string
  meta: number
  frecuencia: Frecuencia;
  descripcion: string; // Added descripcion
  actual: number; // Added actual
}

export interface FiltroFecha {
  fecha_inicio: string
  fecha_fin: string
}

export interface UserUpdate {
  username?: string
  password?: string
}

// Servicio API genérico
export const apiService = {
  // Método para realizar solicitudes autenticadas
  async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = authService.getAccessToken()
    
    if (!token) {
      console.error("No hay token de acceso")
      throw new Error("No autenticado - Token no disponible")
    }

    console.log("Token completo:", token)

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, finalOptions)
      
      // Si la respuesta es 204 (No Content), retornar null
      if (response.status === 204) {
        return null
      }

      // Intentar parsear la respuesta como JSON
      const text = await response.text()
      let data
      
      try {
        data = text ? JSON.parse(text) : null
      } catch (e) {
        throw new Error(`Error al parsear respuesta: ${text || response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(
          data?.message || data?.detail || `Error en la solicitud: ${response.status} ${response.statusText}`
        )
      }

      return data
    } catch (error) {
      console.error("Error en fetchWithAuth:", error)
      throw error
    }
  },

  // INGRESOS
  async getIngresos(): Promise<Ingreso[]> {
    console.log("Solicitando ingresos...")
    const data = await this.fetchWithAuth("/api/finanzas/ingresos/")
    console.log("Respuesta de ingresos:", data)
    return data
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
    console.log("Solicitando gastos...")
    const data = await this.fetchWithAuth("/api/finanzas/gastos/")
    console.log("Respuesta de gastos:", data)
    return data
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

  async addAhorroObjetivo(objetivoId: number, monto: number, fecha: string): Promise<any> {
    return this.fetchWithAuth(`/api/finanzas/objetivo/${objetivoId}/ahorro/`, {
      method: "POST",
      body: JSON.stringify({ monto, fecha }),
    });
  },

  // FILTRADO POR RANGO DE FECHAS
  async getIngresosPorRango(filtro: FiltroFecha): Promise<Ingreso[]> {
    return this.fetchWithAuth("/api/finanzas/I_rango/", {
      method: "POST",
      body: JSON.stringify(filtro),
    })
  },

  async getGastosPorRango(filtro: FiltroFecha): Promise<Gasto[]> {
    return this.fetchWithAuth("/api/finanzas/G_rango/", {
      method: "POST",
      body: JSON.stringify(filtro),
    })
  },

  // ACTUALIZAR USUARIO
  async updateUser(data: UserUpdate): Promise<any> {
    return this.fetchWithAuth("/api/register/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },
}
