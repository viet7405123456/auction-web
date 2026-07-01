import { api } from './authApi.js'

/**
 * GET /api/admin/contacts
 */
export async function getAdminContacts({ page = 0, size = 10, sortDirection = 'DESC' } = {}) {
  const res = await api.get('/contacts', {
    params: { page, size, sortDirection },
  })
  return res.data
}
