import {configureStore} from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import accountReducer from '../features/account/accountSlice.js'
import uiReducer from '../features/ui/uiSlice.js'

const store = configureStore({
  reducer: {
    auth: authReducer,
    account: accountReducer,
    ui: uiReducer,
  },
  devTools: true,
})

export default store