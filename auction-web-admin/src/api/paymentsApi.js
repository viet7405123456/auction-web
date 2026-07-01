import { api } from './authApi.js'

/**
 * GET /api/admin/payments
 * @param {{ page?: number, size?: number, sortDirection?: string }} params
 */
export async function getAdminPayments({ page = 0, size = 10, sortDirection = 'DESC' } = {}) {
  const params = { page, size, sortDirection }
  const res = await api.get('/payments', { params })
  return res.data
}
