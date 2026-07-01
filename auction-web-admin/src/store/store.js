import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import usersReducer from '../features/users/usersSlice.js'
import listingsReducer from '../features/listings/listingsSlice.js'
import auctionsReducer from '../features/Auctions/auctionSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    listings: listingsReducer,
    auctions: auctionsReducer,
  },
})
