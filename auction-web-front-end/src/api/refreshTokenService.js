import axios from 'axios'
import { isTokenExpired } from '../utils/authUtils.js'

const AUTH_KEY = 'auth'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8080/api`

let refreshPromise = null

const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const clearAuthAndRedirect = () => {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch {
    // Ignore storage failures
  }

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export const refreshAccessToken = async () => {
  const auth = readStoredAuth()
  const refreshToken = auth?.refreshToken

  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh-token`, null, {
        headers: {
          'x-token': refreshToken,
          'Content-Type': 'application/json',
        },
      })
      .then((res) => {
        const nextAccessToken = res?.data?.accessToken
        const nextRefreshToken = res?.data?.refreshToken || refreshToken

        if (!nextAccessToken) {
          throw new Error('Refresh response missing accessToken')
        }

        const nextAuth = {
          ...(auth || {}),
          isAuthenticated: true,
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          tokenType: res?.data?.tokenType || auth?.tokenType || 'Bearer',
          user: {
            ...(auth?.user || {}),
            userId: res?.data?.userId ?? auth?.user?.userId,
          },
        }

        localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth))
        return nextAccessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const ensureValidAccessToken = async () => {
  const auth = readStoredAuth()
  const accessToken = auth?.accessToken

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken
  }

  if (auth?.refreshToken) {
    return refreshAccessToken()
  }

  return null
}

export { clearAuthAndRedirect }
