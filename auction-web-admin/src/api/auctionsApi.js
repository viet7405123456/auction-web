import { api } from './authApi.js'

function getAuthToken() {
  try {
    const raw = localStorage.getItem('auth')
    const auth = raw ? JSON.parse(raw) : null
    return auth?.accessToken || null
  } catch {
    return null
  }
}

/**
 * GET /api/admin/auctions
 */
export async function getAdminAuctions({ page = 0, size = 10, status, sortDirection = 'DESC' } = {}) {
  const params = { page, size, sortDirection }
  if (status && status !== 'all') params.status = status
  const res = await api.get('/auctions', { params })
  return res.data
}

/**
 * POST /api/admin/auctions/:auctionId/cancel
 */
export async function cancelAdminAuction(auctionId) {
  const res = await api.post(`/auctions/${auctionId}/cancel`)
  return res.data
}

export async function getAuctionResult(auctionId) {
  const token = getAuthToken()
  const res = await fetch(`http://localhost:8080/api/auctions/${auctionId}/result`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Không tải được kết quả phiên #${auctionId}`)
  }

  return res.json()
}
