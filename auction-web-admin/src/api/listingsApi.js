import { api } from './authApi.js'

/**
 * GET /api/admin/listings
 * @param {{ page?: number, size?: number, status?: string, sortDirection?: string }} params
 */
export async function getAdminListings({ page = 0, size = 10, status, sortDirection = 'DESC' } = {}) {
  const params = { page, size, sortDirection }
  if (status && status !== 'all') params.status = status
  const res = await api.get('/listings', { params })
  return res.data
}

/**
 * PATCH /api/admin/listings/:id
 * @param {number|string} listingId
 * @param {{ status: string, rejectedReason?: string|null, userId: number, approvedAt?: string|null }} payload
 */
export async function patchAdminListing(listingId, payload) {
  const res = await api.patch(`/listings/${listingId}`, payload)
  return res.data
}
