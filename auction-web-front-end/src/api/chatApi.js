import { http } from './httpClient.js'

export async function getConversations() {
  const res = await http.get('/chats/conversations')
  return res.data
}

export async function createOrGetDirectConversation(targetUserId) {
  const res = await http.post('/chats/conversations/direct', { targetUserId })
  return res.data
}

export async function getConversationMessages(conversationId, { page = 0, size = 10 } = {}) {
  const res = await http.get(`/chats/conversations/${conversationId}/messages`, {
    params: { page, size },
  })
  return res.data
}

export async function sendConversationMessage(conversationId, payload) {
  const res = await http.post(`/chats/conversations/${conversationId}/messages`, payload)
  return res.data
}

export async function markConversationAsRead(conversationId) {
  await http.post(`/chats/conversations/${conversationId}/read`)
}

export async function getUnreadMessageCount() {
  const res = await http.get('/chats/unread-count')
  return res.data
}
