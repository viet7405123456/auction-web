import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit'
import { apiGetUsers, apiPatchUser } from '../../api/fakeApi.js'
import { api } from '../../api/usersApi.js'

// export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
//   return await apiGetUsers()
// })

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 0, size = 10 } = {}, { rejectWithValue }) => {
    try {
      const data = await api
        .get(`/users?page=${page}&size=${size}`)
        .then((res) => res.data)

      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Lấy danh sách user thất bại'
      )
    }
  }
)

export const patchUser = createAsyncThunk(
  'users/patchUser',
  async ({ userId, patch }, { rejectWithValue }) => {
    try {
      const data = await api.patch(`/users/${userId}`, patch).then(res => res.data)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Cập nhật user thất bại'
      )
    }
  }
)



const usersAdapter = createEntityAdapter({
  selectId: (u) => u.userId,
  sortComparer: (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
})

const initialState = usersAdapter.getInitialState({
  status: 'idle',
  error: null,
  filters: {
    q: '',
    verified: 'all', // all | verified | unverified
    locked: 'all', // all | locked | unlocked
    enabled: 'all', // all | enabled | disabled
    role: 'all', // all | BIDDER | SELLER | ADMIN ...
  },
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    last: true,
  },
  selectedUserId: null,
})

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsersFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    setUsersPage(state, action) {
      state.pagination.page = action.payload
    },
    setUsersPageSize(state, action) {
      state.pagination.size = action.payload
      state.pagination.page = 0
    },
    selectUser(state, action) {
      state.selectedUserId = action.payload
    },
    clearSelectedUser(state) {
      state.selectedUserId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        const payload = action.payload || {}
        usersAdapter.setAll(state, payload.content || [])

        state.pagination.page = payload.page ?? 0
        state.pagination.size = payload.size ?? 10
        state.pagination.totalElements = payload.totalElements ?? 0
        state.pagination.totalPages = payload.totalPages ?? 0
        state.pagination.last = payload.last ?? true
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ||action.error.message
      })
      .addCase(patchUser.fulfilled, (state, action) => {
        usersAdapter.upsertOne(state, action.payload)
      })
      .addCase(patchUser.rejected, (state, action) => {
        state.error = action.payload || action.error.message
      })
  },
})

export const { setUsersFilters,
  setUsersPage,
  setUsersPageSize,
  selectUser,
  clearSelectedUser, } = usersSlice.actions
export default usersSlice.reducer

export const usersSelectors = usersAdapter.getSelectors((state) => state.users)

export function selectFilteredUsers(state) {
  const { q, verified, locked, enabled, role } = state.users.filters
  const list = usersSelectors.selectAll(state)

  const needle = q.trim().toLowerCase()
  return list.filter((u) => {
    if (needle) {
      const hay = `${u.username} ${u.email}`.toLowerCase()
      if (!hay.includes(needle)) return false
    }
    if (verified !== 'all') {
      const want = verified === 'verified'
      if (Boolean(u.isVerified) !== want) return false
    }
    if (locked !== 'all') {
      const want = locked === 'locked'
      if (Boolean(u.accountLocked) !== want) return false
    }
    if (enabled !== 'all') {
      const want = enabled === 'enabled'
      if (Boolean(u.enabled) !== want) return false
    }
    if (role !== 'all') {
      if (String(u.role) !== role) return false
    }
    return true
  })
}
