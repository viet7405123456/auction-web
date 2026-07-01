import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  toasts: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    pushToast(state, action) {
      const payload = action.payload || {}
      const id = payload.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      state.toasts.push({
        id,
        type: payload.type || 'success',
        title: payload.title || '',
        message: payload.message || '',
        duration: Number(payload.duration || 3200),
      })
    },
    removeToast(state, action) {
      const id = action.payload
      state.toasts = state.toasts.filter((toast) => toast.id !== id)
    },
    clearToasts(state) {
      state.toasts = []
    },
  },
})

export const { pushToast, removeToast, clearToasts } = uiSlice.actions
export default uiSlice.reducer
