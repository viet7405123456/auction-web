import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../../api/authApi.js'
import { isTokenExpired } from '../../utils/authUtils.js'
import { api as apiUpload } from '../../api/uploadApi.js'
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

const clearAuthFromLocalStorage = () => {
  try {
    localStorage.removeItem(AUTH_KEY)
  } catch (error) {
    console.error('Lỗi xóa auth khỏi localStorage:', error)
  }
}

const parseJwt = (token) => {
  try {
    if (!token) return null

    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    )

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

const normalizeAuthError = (error, fallbackMessage = 'Đăng nhập thất bại') => {
  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    fallbackMessage

  const message = String(rawMessage || fallbackMessage).trim()
  const lowerMessage = message.toLowerCase()

  if (error?.code === 'ERR_NETWORK' || lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.'
  }

  if (lowerMessage.includes('bad credentials') || lowerMessage.includes('invalid credentials') || lowerMessage.includes('incorrect username or password')) {
    return 'Email hoặc mật khẩu không đúng.'
  }

  if (lowerMessage.includes('locked') || lowerMessage.includes('account locked')) {
    return 'Tài khoản của bạn đang bị khóa.'
  }

  if (lowerMessage.includes('disabled') || lowerMessage.includes('account disabled')) {
    return 'Tài khoản của bạn đã bị vô hiệu hóa.'
  }

  if (Number(error?.response?.status) === 401) {
    return 'Thông tin đăng nhập không hợp lệ.'
  }

  if (Number(error?.response?.status) === 403) {
    return 'Bạn không có quyền truy cập.'
  }

  return message || fallbackMessage
}

export const uploadFile = createAsyncThunk(
  "auth/uploadFile",
  async ({ file, fileType }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiUpload.post("/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const url = typeof res?.data === 'string'
        ? res.data
        : res?.data?.url ||
          res?.data?.data?.url ||
          res?.data?.result?.url ||
          res?.data?.secureUrl ||
          '';

      if (!url) {
        return rejectWithValue("Backend không trả về URL ảnh");
      }

      return { fileType, url };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data ||
          error.message ||
          "Upload ảnh thất bại"
      );
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/register", payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.response?.data ||
          error.message ||
          "Đăng ký thất bại"
      );
    }
  }
);

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
      return rejectWithValue(normalizeAuthError(error))
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.get('/logout')
  } catch (error) {
    console.warn('Logout API failed:', error?.response?.status || error?.message)
  }

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

  if (!auth?.accessToken && !auth?.refreshToken) {
    clearAuthFromLocalStorage()
    return null
  }

  if (auth?.accessToken && isTokenExpired(auth.accessToken) && !auth?.refreshToken) {
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
  registerStatus: 'idle',
  registerError: null,
  uploadStatus: {
    avatar: "idle",
    cccdFront: "idle",
    cccdBack: "idle",
  },
  uploadError: {
    avatar: null,
    cccdFront: null,
    cccdBack: null,
  },
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null
    },
    clearRegisterError: (state) => {
      state.registerError = null;
    },
    clearUploadError: (state, action) => {
      const key = action.payload;
      if (key && state.uploadError[key] !== undefined) {
        state.uploadError[key] = null;
      }
    },
  },
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
      .addCase(register.pending, (state) => {
        state.registerStatus = "loading";
        state.registerError = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.registerStatus = "succeeded";
        state.registerError = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.registerStatus = "failed";
        state.registerError =
          action.payload || action.error.message || "Đăng ký thất bại";
      })

      .addCase(uploadFile.pending, (state, action) => {
        const key = action.meta.arg.fileType;
        if (state.uploadStatus[key] !== undefined) {
          state.uploadStatus[key] = "loading";
          state.uploadError[key] = null;
        }
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        const key = action.payload.fileType;
        if (state.uploadStatus[key] !== undefined) {
          state.uploadStatus[key] = "succeeded";
          state.uploadError[key] = null;
        }
      })
      .addCase(uploadFile.rejected, (state, action) => {
        const key = action.meta.arg.fileType;
        if (state.uploadStatus[key] !== undefined) {
          state.uploadStatus[key] = "failed";
          state.uploadError[key] =
            action.payload || action.error.message || "Upload thất bại";
        }
      });
  },
})

export const {
  clearAuthError,
  clearRegisterError,
  clearUploadError,
} = authSlice.actions;
export default authSlice.reducer