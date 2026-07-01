import axios from 'axios'
import { clearAuthAndRedirect, ensureValidAccessToken, refreshAccessToken } from './refreshTokenService.js'

const AUTH_KEY = 'auth'

export const api = axios.create({
  baseURL: 'http://localhost:8080/api/upload',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await ensureValidAccessToken()

      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error?.config || {}

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const nextAccessToken = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
        return api(originalRequest)
      } catch {
        clearAuthAndRedirect()
      }
    }

    return Promise.reject(error)
  }
)