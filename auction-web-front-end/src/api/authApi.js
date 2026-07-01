import axios from 'axios'
import { clearAuthAndRedirect, refreshAccessToken } from './refreshTokenService.js'

const AUTH_KEY = 'auth'

export const api = axios.create({
  baseURL: 'http://localhost:8080/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      const auth = raw ? JSON.parse(raw) : null
      const token = auth?.accessToken

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Không đọc được token từ localStorage:', error)
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const requestUrl = error?.config?.url || ''
    const originalRequest = error?.config || {}

    const isAuthBypassRequest =
      requestUrl.includes('/login') ||
      requestUrl.includes('/refresh-token') ||
      requestUrl.includes('/register')

    if (status === 401 && !isAuthBypassRequest && !originalRequest._retry) {
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

    if (status === 401 && isAuthBypassRequest) {
      clearAuthAndRedirect()
    }

    return Promise.reject(error)
  }
)