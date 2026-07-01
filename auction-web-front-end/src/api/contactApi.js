import { http } from './httpClient.js'

export async function submitContactMessage(payload) {
  const res = await http.post('/contact', payload, { skipAuth: false })
  return res.data
}
