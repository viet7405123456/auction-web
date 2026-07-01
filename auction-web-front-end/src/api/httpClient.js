import axios from 'axios'
import { clearAuthAndRedirect, ensureValidAccessToken, refreshAccessToken } from './refreshTokenService.js'

const AUTH_KEY = 'auth'
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8080/api`

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(
  async (config) => {
    if (config?.skipAuth) {
      return config
    }

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
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status

    const originalRequest = error?.config || {}
    const looksLikeTokenIssue =
      status === 401 ||
      (status === 403 && Boolean(originalRequest?.headers?.Authorization))

    if (looksLikeTokenIssue && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const nextAccessToken = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`
        return http(originalRequest)
      } catch {
        clearAuthAndRedirect()
      }
    }

    return Promise.reject(error)
  },
)
