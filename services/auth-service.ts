// Constantes
const API_URL = "https://finanzasapi-c7or.onrender.com"

// Tipos
export interface AuthResponse {
  access?: string
  refresh?: string
  message?: string
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
  id?: number
}

// Función para mostrar logs en consola con formato
const logRequest = (title: string, data: any) => {
  console.group(`🌐 ${title}`)
  console.log(data)
  console.groupEnd()
}

// Servicio de autenticación
export const authService = {
  // Registrar un nuevo usuario
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    logRequest("REGISTRO - Datos enviados", { ...credentials, password: "***" })

    try {
      const response = await fetch(`${API_URL}/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const responseData = await response.json()

      logRequest("REGISTRO - Respuesta", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      })

      if (!response.ok) {
        throw new Error(responseData.message || "Error al registrar usuario")
      }

      return responseData
    } catch (error) {
      console.error("❌ Error en el registro:", error)
      throw error
    }
  },

  // Iniciar sesión
  async login(credentials: LoginCredentials): Promise<UserData> {
    logRequest("LOGIN - Datos enviados", { ...credentials, password: "***" })

    try {
      const response = await fetch(`${API_URL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const responseData = await response.json()

      logRequest("LOGIN - Respuesta", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      })

      if (!response.ok) {
        throw new Error(responseData.detail || "Error al iniciar sesión")
      }

      // Guardar tokens en localStorage
      if (responseData.access) {
        localStorage.setItem("accessToken", responseData.access)
        console.log("✅ Token de acceso guardado en localStorage")
      }

      if (responseData.refresh) {
        localStorage.setItem("refreshToken", responseData.refresh)
        console.log("✅ Token de refresco guardado en localStorage")
      }

      // Guardar datos del usuario
      const userData: UserData = {
        username: credentials.username,
      }
      localStorage.setItem("userData", JSON.stringify(userData))
      console.log("✅ Datos de usuario guardados:", userData)

      return userData
    } catch (error) {
      console.error("❌ Error en el login:", error)
      throw error
    }
  },

  // Refrescar token
  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("refreshToken")
    console.log("🔄 Intentando refrescar token")

    if (!refreshToken) {
      console.log("❌ No hay refresh token disponible")
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

      const responseData = await response.json()

      logRequest("REFRESH TOKEN - Respuesta", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      })

      if (!response.ok) {
        throw new Error(responseData.detail || "Error al refrescar token")
      }

      // Actualizar token en localStorage
      if (responseData.access) {
        localStorage.setItem("accessToken", responseData.access)
        console.log("✅ Token de acceso actualizado")
        return responseData.access
      }

      return null
    } catch (error) {
      console.error("❌ Error al refrescar token:", error)
      return null
    }
  },

  // Cerrar sesión
  logout(): void {
    console.log("🚪 Cerrando sesión")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userData")
    console.log("✅ Datos de sesión eliminados")
  },

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem("accessToken")
    console.log("🔍 Verificando autenticación:", token ? "Token disponible" : "No hay token")
    return !!token
  },

  // Obtener token de acceso
  getAccessToken(): string | null {
    const token = localStorage.getItem("accessToken")
    return token
  },

  // Obtener datos del usuario
  getUserData(): UserData | null {
    try {
      const userData = localStorage.getItem("userData")
      const parsedData = userData ? JSON.parse(userData) : null
      console.log("👤 Datos de usuario recuperados:", parsedData)
      return parsedData
    } catch (error) {
      console.error("❌ Error al obtener datos del usuario:", error)
      return null
    }
  },
}
