import { http } from './httpClient.js'

export async function getNotifications({ page = 0, size = 10 } = {}) {
  const res = await http.get('/notifications', { params: { page, size } })
  return res.data
}

export async function getUnreadNotificationCount() {
  const res = await http.get('/notifications/unread-count')
  return res.data
}

export async function markNotificationsRead(notificationIds) {
  const res = await http.patch('/notifications/read', { notificationIds })
  return res.data
}

export async function markAllNotificationsRead() {
  const res = await http.patch('/notifications/read-all')
  return res.data
}
