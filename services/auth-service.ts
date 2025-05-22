// Constantes
const API_URL = "https://finanzasapi-c7or.onrender.com"
import Cookies from "js-cookie"

// Tipos
export interface AuthResponse {
  access?: string
  refresh?: string
  message?: string
  user?: {
    username: string
  }
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterCredentials {
  username: string
  password: string
}

export interface UserData {
  username: string
}

// Servicio de autenticación
export const authService = {
  // Registrar un nuevo usuario
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario")
      }

      return data
    } catch (error) {
      console.error("Error en el registro:", error)
      throw error
    }
  },

  // Iniciar sesión
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error al iniciar sesión")
      }

      // Guardar tokens en cookies
      if (data.access) {
        Cookies.set("accessToken", data.access, { expires: 1 }) // Expira en 1 día
      }
      if (data.refresh) {
        Cookies.set("refreshToken", data.refresh, { expires: 7 }) // Expira en 7 días
      }

      // Guardar información del usuario
      Cookies.set("userData", JSON.stringify({ username: credentials.username }), { expires: 7 })

      return {
        ...data,
        user: { username: credentials.username },
      }
    } catch (error) {
      console.error("Error en el login:", error)
      throw error
    }
  },

  // Refrescar token
  async refreshToken(): Promise<string | null> {
    const refreshToken = Cookies.get("refreshToken")

    if (!refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_URL}/api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Error al refrescar token")
      }

      // Actualizar token en cookies
      if (data.access) {
        Cookies.set("accessToken", data.access, { expires: 1 })
        return data.access
      }

      return null
    } catch (error) {
      console.error("Error al refrescar token:", error)
      return null
    }
  },

  // Cerrar sesión
  logout(): void {
    Cookies.remove("accessToken")
    Cookies.remove("refreshToken")
    Cookies.remove("userData")
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!Cookies.get("accessToken")
  },

  // Obtener token de acceso
  getAccessToken(): string | null {
    return Cookies.get("accessToken") || null
  },

  // Obtener datos del usuario
  getUserData(): UserData | null {
    const userData = Cookies.get("userData")
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (e) {
        return null
      }
    }
    return null
  },
}
