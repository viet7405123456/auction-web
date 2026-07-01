import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit'
import { getAdminListings, patchAdminListing } from '../../api/listingsApi'

const toLocalDateTimeString = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('')
}

const normalizeListing = (item) => ({
  id: item.id,
  title: item.title ?? '',
  description: item.description ?? '',
  status: item.status ?? 'SUBMITTED',
  addressSell: item.addressSell ?? '',
  thumbnailUrl: item.thumbnailUrl ?? '',
  createdAt: item.createdAt ?? null,
  updatedAt: item.updatedAt ?? item.createdAt ?? null,
  submittedAt: item.submittedAt ?? null,
  approvedAt: item.approvedAt ?? null,
  rejectedReason: item.rejectedReason ?? null,
  viewCount: Number(item.viewCount ?? 0),

  seller: item.seller
    ? {
        id: item.seller.id ?? item.seller.userId ?? null,
        name:
          item.seller.profile?.fullname ||
          item.seller.username ||
          item.seller.email ||
          'Không rõ',
        email: item.seller.email || '',
        verified: Boolean(item.seller.verified),
      }
    : null,

  reviewedBy: item.reviewedBy
    ? {
        id: item.reviewedBy.id ?? item.reviewedBy.userId ?? null,
        username:
          item.reviewedBy.profile?.fullname ||
          item.reviewedBy.username ||
          item.reviewedBy.email ||
          'Admin',
        email: item.reviewedBy.email || '',
      }
    : null,

  car: item.car
    ? {
        carId: item.car.carId,
        name: item.car.name || '',
        brand: item.car.brand || '',
        model: item.car.model || '',
        year: item.car.year || '',
        fuelType: item.car.fuelType || '',
        transmission: item.car.transmission || '',
        bodyType: item.car.bodyType || '',
        engine: item.car.engine || '',
        horsepower: item.car.horsepower || '',
        mileage: item.car.mileage || '',
        color: item.car.color || '',
        seats: item.car.seats || '',
        origin: item.car.origin || '',
        images: Array.isArray(item.car.images) ? item.car.images : [],
      }
    : null,

  documents: Array.isArray(item.documents) ? item.documents : [],
})

export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async ({ page = 0, size = 10, status = 'all', sortDirection = 'DESC' } = {}) => {
    const res = await getAdminListings({ page, size, status, sortDirection })
    const rawItems = Array.isArray(res) ? res : res?.content || []

    return {
      items: rawItems.map(normalizeListing),
      meta: {
        page: res?.number ?? page,
        size: res?.size ?? size,
        totalPages: res?.totalPages ?? 1,
        totalElements: res?.totalElements ?? rawItems.length,
      },
    }
  },
)

export const approveListing = createAsyncThunk(
  'listings/approveListing',
  async ({ listingId, authUser }) => {
    const payload = {
      status: 'APPROVED',
      rejectedReason: null,
      approvedAt: toLocalDateTimeString(),
      userId: authUser?.userId ?? authUser?.id ?? null,
    }

    const res = await patchAdminListing(listingId, payload)
    return normalizeListing(res)
  },
)

export const rejectListing = createAsyncThunk(
  'listings/rejectListing',
  async ({ listingId, rejectedReason, authUser }) => {
    const payload = {
      status: 'REJECTED',
      rejectedReason: rejectedReason?.trim() || '',
      approvedAt: null,
      userId: authUser?.userId ?? authUser?.id ?? null,
    }

    const res = await patchAdminListing(listingId, payload)
    return normalizeListing(res)
  },
)

export const resetListingReview = createAsyncThunk(
  'listings/resetListingReview',
  async ({ listingId, authUser }) => {
    const payload = {
      status: 'SUBMITTED',
      rejectedReason: null,
      approvedAt: null,
      userId: authUser?.userId ?? authUser?.id ?? null,
    }

    const res = await patchAdminListing(listingId, payload)
    return normalizeListing(res)
  },
)

const listingsAdapter = createEntityAdapter({
  selectId: (l) => l.id,
  sortComparer: (a, b) =>
    String(b.updatedAt || b.createdAt || '').localeCompare(
      String(a.updatedAt || a.createdAt || ''),
    ),
})

const initialState = listingsAdapter.getInitialState({
  status: 'idle',
  error: null,
  filters: {
    q: '',
    status: 'all',
    sortDirection: 'DESC',
  },
  pagination: {
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0,
  },
  selectedListingId: null,
  mutatingIds: {},
})

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListingsFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    setListingsPagination(state, action) {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    selectListing(state, action) {
      state.selectedListingId = action.payload
    },
    clearSelectedListing(state) {
      state.selectedListingId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.error = null
        listingsAdapter.setAll(state, action.payload.items)
        state.pagination = { ...state.pagination, ...action.payload.meta }
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Không tải được danh sách bài đăng'
      })

      .addCase(approveListing.pending, (state, action) => {
        state.mutatingIds[action.meta.arg.listingId] = true
      })
      .addCase(approveListing.fulfilled, (state, action) => {
        delete state.mutatingIds[action.payload.id]
        listingsAdapter.upsertOne(state, action.payload)
      })
      .addCase(approveListing.rejected, (state, action) => {
        delete state.mutatingIds[action.meta.arg.listingId]
        state.error = action.error.message || 'Không thể duyệt bài đăng'
      })

      .addCase(rejectListing.pending, (state, action) => {
        state.mutatingIds[action.meta.arg.listingId] = true
      })
      .addCase(rejectListing.fulfilled, (state, action) => {
        delete state.mutatingIds[action.payload.id]
        listingsAdapter.upsertOne(state, action.payload)
      })
      .addCase(rejectListing.rejected, (state, action) => {
        delete state.mutatingIds[action.meta.arg.listingId]
        state.error = action.error.message || 'Không thể từ chối bài đăng'
      })

      .addCase(resetListingReview.pending, (state, action) => {
        state.mutatingIds[action.meta.arg.listingId] = true
      })
      .addCase(resetListingReview.fulfilled, (state, action) => {
        delete state.mutatingIds[action.payload.id]
        listingsAdapter.upsertOne(state, action.payload)
      })
      .addCase(resetListingReview.rejected, (state, action) => {
        delete state.mutatingIds[action.meta.arg.listingId]
        state.error = action.error.message || 'Không thể đặt lại trạng thái bài đăng'
      })
  },
})

export const {
  setListingsFilters,
  setListingsPagination,
  selectListing,
  clearSelectedListing,
} = listingsSlice.actions

export default listingsSlice.reducer

export const listingsSelectors = listingsAdapter.getSelectors((state) => state.listings)

export const selectSelectedListing = createSelector(
  [
    (state) => state.listings.selectedListingId,
    (state) => state,
  ],
  (selectedId, state) => (selectedId ? listingsSelectors.selectById(state, selectedId) : null),
)

export const selectFilteredListings = createSelector(
  [
    listingsSelectors.selectAll,
    (state) => state.listings.filters,
  ],
  (all, filters) => {
    const needle = filters.q.trim().toLowerCase()

    return all.filter((l) => {
      if (filters.status !== 'all' && String(l.status) !== filters.status) return false

      if (needle) {
        const hay = [
          l.title,
          l.description,
          l.seller?.name,
          l.seller?.email,
          l.car?.name,
          l.car?.brand,
          l.car?.model,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        if (!hay.includes(needle)) return false
      }

      return true
    })
  },
)