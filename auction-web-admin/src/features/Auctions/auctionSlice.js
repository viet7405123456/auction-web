import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit'
import { apiGetAuctions, apiPatchAuction } from '../../api/fakeApi.js'
import { listingsSelectors } from '../listings/listingsSlice.js'
import { usersSelectors } from '../users/usersSlice.js'

export const fetchAuctions = createAsyncThunk('auctions/fetchAuctions', async () => {
	return await apiGetAuctions()
})

export const patchAuction = createAsyncThunk('auctions/patchAuction', async ({ auctionId, patch }) => {
	return await apiPatchAuction(auctionId, patch)
})

const auctionsAdapter = createEntityAdapter({
	selectId: (a) => a.auctionId,
	sortComparer: (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
})

const initialState = auctionsAdapter.getInitialState({
	status: 'idle',
	error: null,
	filters: {
		q: '',
		status: 'all',
	},
	selectedAuctionId: null,
})

const auctionsSlice = createSlice({
	name: 'auctions',
	initialState,
	reducers: {
		setAuctionsFilters(state, action) {
			state.filters = { ...state.filters, ...action.payload }
		},
		selectAuction(state, action) {
			state.selectedAuctionId = action.payload
		},
		clearSelectedAuction(state) {
			state.selectedAuctionId = null
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAuctions.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchAuctions.fulfilled, (state, action) => {
				state.status = 'succeeded'
				auctionsAdapter.setAll(state, action.payload)
			})
			.addCase(fetchAuctions.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.error.message
			})
			.addCase(patchAuction.fulfilled, (state, action) => {
				auctionsAdapter.upsertOne(state, action.payload)
			})
	},
})

export const { setAuctionsFilters, selectAuction, clearSelectedAuction } = auctionsSlice.actions
export default auctionsSlice.reducer

export const auctionsSelectors = auctionsAdapter.getSelectors((state) => state.auctions)

export const selectFilteredAuctions = createSelector(
	[auctionsSelectors.selectAll, (state) => state.auctions.filters],
	(all, filters) => {
		const needle = filters.q.trim().toLowerCase()

		return all.filter((a) => {
			if (filters.status !== 'all' && String(a.status) !== filters.status) return false

			if (needle) {
				const hay = `${a.title || ''} ${a.auctionId || ''} ${a.listingId || ''}`.toLowerCase()
				if (!hay.includes(needle)) return false
			}

			return true
		})
	},
)

export const selectFilteredAuctionsEnriched = createSelector(
	[selectFilteredAuctions, usersSelectors.selectEntities, listingsSelectors.selectEntities],
	(auctions, usersById, listingsById) => {
		return auctions.map((a) => ({
			...a,
			seller: a.sellerId ? usersById[a.sellerId] : null,
			currentHighestBidder: a.currentHighestBidderId ? usersById[a.currentHighestBidderId] : null,
			winner: a.auctionResult?.winnerUserId ? usersById[a.auctionResult.winnerUserId] : null,
			reviewedBy:
				a.reviewedByUserId != null
					? usersById[a.reviewedByUserId] || (a.reviewedByUserId === 0 ? { userId: 0, name: 'Admin', email: 'admin@demo.com' } : null)
					: null,
			listing: a.listingId ? listingsById[a.listingId] : null,
		}))
	},
)
