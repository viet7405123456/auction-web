import { http } from './httpClient.js'

export async function getMyProfile() {
  const res = await http.get('/user/me')
  return res.data
}

export async function getAccountOverview() {
  const res = await http.get('/user/overview')
  return res.data
}

export async function getMyLikedListings({ page = 0, size = 6 } = {}) {
  const res = await http.get('/user/liked-listings', { params: { page, size } })
  return res.data
}

export async function getMyWonAuctions({ page = 0, size = 6 } = {}) {
  const res = await http.get('/user/won-auctions', { params: { page, size } })
  return res.data
}

export async function updateMyAvatar(avatarUrl) {
  const res = await http.patch('/user/me/avatar', { avatarUrl })
  return res.data
}

export async function changeMyPassword({ currentPassword, newPassword, confirmPassword }) {
  const res = await http.patch('/user/me/password', {
    currentPassword,
    newPassword,
    confirmPassword,
  })
  return res.data
}

export async function getMyPayments({ page = 0, size = 10 } = {}) {
  const res = await http.get('/payments/me', { params: { page, size } })
  return res.data
}

export async function completeMyPayment(paymentId) {
  const res = await http.post(`/payments/${paymentId}/complete`)
  return res.data
}
