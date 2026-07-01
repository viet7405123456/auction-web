import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../../api/authApi.js'
import { isTokenExpired } from '../../utils/authUtils.js'


const AUTH_KEY = 'auth'



const loadAuthFromLocalStorage = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Lỗi đọc auth từ localStorage:', error)
    return null
  }
}

const saveAuthToLocalStorage = (authData) => {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
  } catch (error) {
    console.error('Lỗi lưu auth vào localStorage:', error)
  }
}

// xóa auth khỏi localStorage
const clearAuthFromLocalStorage = () => {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch (error) {
    console.error('Lỗi xóa auth khỏi localStorage:', error)
  }
}

// decode payload JWT
const parseJwt = (token) => {
  try {
    if (!token) return null

    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Không decode được JWT:', error)
    return null
  }
}

const extractRolesFromToken = (token) => {
  const payload = parseJwt(token)
  if (!payload) return []

  // backend của bạn đang có dạng:
  // role: [{ authority: "ROLE_ADMIN" }]
  const rawRoles = payload.role || payload.roles || payload.authorities || []

  if (Array.isArray(rawRoles)) {
    return rawRoles
      .map((item) => {
        if (typeof item === 'string') return item
        if (item?.authority) return item.authority
        return null
      })
      .filter(Boolean)
  }

  return []
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/login', { email, password })
      const data = res.data

      const accessToken = data?.accessToken
      const refreshToken = data?.refreshToken
      const userId = data?.userId
      const tokenType = data?.tokenType || 'Bearer'

      if (!accessToken || !refreshToken) {
        return rejectWithValue('Server không trả về accessToken hoặc refreshToken')
      }

      const roles = extractRolesFromToken(accessToken)
      const role = roles[0] ? roles[0].replace(/^ROLE_/, '') : null

      const payload = {
        isAuthenticated: true,
        accessToken,
        refreshToken,
        tokenType,
        user: {
          userId,
          email,
          role,
          roles,
        },
      }

      saveAuthToLocalStorage(payload)
      return payload
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data ||
          error.message ||
          'Đăng nhập thất bại'
      )
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  clearAuthFromLocalStorage()
  return {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    tokenType: null,
    user: null,
  }
})

const getValidatedAuth = () => {
  const auth = loadAuthFromLocalStorage()

  if (!auth?.accessToken) {
    clearAuthFromLocalStorage()
    return null
  }

  if (isTokenExpired(auth.accessToken)) {
    clearAuthFromLocalStorage()
    return null
  }

  return auth
}

const persistedAuth = getValidatedAuth()

const initialState = {
  isAuthenticated: persistedAuth?.isAuthenticated || false,
  accessToken: persistedAuth?.accessToken || null,
  refreshToken: persistedAuth?.refreshToken || null,
  tokenType: persistedAuth?.tokenType || 'Bearer',
  user: persistedAuth?.user || null,
  status: 'idle',
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.isAuthenticated = true
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.tokenType = action.payload.tokenType
        state.user = action.payload.user
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || action.error.message || 'Đăng nhập thất bại'
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false
        state.accessToken = null
        state.refreshToken = null
        state.tokenType = null
        state.user = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export default authSlice.reducer
