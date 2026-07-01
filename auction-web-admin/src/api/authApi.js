import anxios from 'axios';

const AUTH_KEY = 'auth'

export const api = anxios.create({
    baseURL: 'http://localhost:8080/api/admin',
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
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('auth')
      window.location.href = '/admin/login'
    }

    return Promise.reject(error)
  }
)